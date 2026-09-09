import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { PiSessionState, PiMessage, ExtensionUiRequest, ExtensionUiResponse } from '../../src/types/pi';

export interface PiProcessOptions {
  cwd: string;
  executablePath?: string;
  provider?: string;
  model?: string;
  thinkingLevel?: string;
  sessionFile?: string;
  sessionName?: string;
  approveLocal?: boolean;
}

export class PiRpcProcess extends EventEmitter {
  private child: ChildProcess | null = null;
  private lineBuffer: string = '';
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: any) => void; timeout: NodeJS.Timeout }>();
  private requestIdCounter = 0;
  private currentCwd: string = '';
  private isAlive: boolean = false;
  private lastStartOptions: PiProcessOptions | null = null;
  private recentStderr: string[] = [];
  private lastExitError: string = '';

  constructor() {
    super();
  }

  public get alive(): boolean {
    return this.isAlive && this.child !== null && !this.child.killed;
  }

  public get cwd(): string {
    return this.currentCwd;
  }

  public get exitError(): string {
    return this.lastExitError;
  }

  public async start(options: PiProcessOptions): Promise<void> {
    if (this.alive) {
      await this.stop();
    }

    this.lastStartOptions = { ...options };

    // Resolve safe, existing working directory (never '.' or non-existent dir)
    let safeCwd = options.cwd;
    if (!safeCwd || safeCwd === '.' || !fs.existsSync(safeCwd)) {
      safeCwd = os.homedir();
    }
    this.currentCwd = safeCwd;

    const isWin = os.platform() === 'win32';
    let exe = options.executablePath || 'pi';

    // On Windows, resolve to .cmd or .exe if bare script was given
    if (isWin) {
      if (!exe.match(/\.(cmd|exe|bat|ps1)$/i)) {
        if (fs.existsSync(exe + '.cmd')) {
          exe = exe + '.cmd';
        } else if (fs.existsSync(exe + '.exe')) {
          exe = exe + '.exe';
        } else if (fs.existsSync(exe + '.bat')) {
          exe = exe + '.bat';
        }
      }
    }

    const args: string[] = ['--mode', 'rpc'];

    // Only pass provider and model if explicitly supplied (otherwise let Pi use its native defaults)
    if (options.provider && options.provider.trim()) {
      args.push('--provider', options.provider.trim());
    }
    if (options.model && options.model.trim()) {
      args.push('--model', options.model.trim());
    }
    if (options.thinkingLevel && options.thinkingLevel.trim()) {
      args.push('--thinking', options.thinkingLevel.trim());
    }
    if (options.sessionName && options.sessionName.trim()) {
      args.push('--name', options.sessionName.trim());
    }
    if (options.sessionFile && options.sessionFile.trim()) {
      args.push('--continue', options.sessionFile.trim());
    }
    if (options.approveLocal) {
      args.push('--approve');
    }

    let spawnCmd = exe;
    let spawnArgs = args;

    if (isWin && exe.endsWith('.ps1')) {
      spawnCmd = 'powershell.exe';
      spawnArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', exe, ...args];
    }

    this.lineBuffer = '';
    this.recentStderr = [];
    this.lastExitError = '';

    this.child = spawn(spawnCmd, spawnArgs, {
      cwd: safeCwd,
      shell: isWin,
      windowsHide: true,
      env: {
        ...process.env,
        PI_OFFLINE: '0'
      }
    });

    this.isAlive = true;

    this.child.stdout?.on('data', (chunk: Buffer) => {
      this.handleStdoutChunk(chunk);
    });

    this.child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      this.recentStderr.push(text);
      if (this.recentStderr.length > 50) this.recentStderr.shift();
      this.emit('stderr', text);
    });

    this.child.on('error', (err) => {
      this.isAlive = false;
      this.lastExitError = err.message || String(err);
      this.emit('error', err);
    });

    this.child.on('close', (code) => {
      this.isAlive = false;
      this.child = null;
      const recent = this.recentStderr.join('').trim();
      this.lastExitError = recent ? recent.slice(-600) : `Process exited with code ${code}`;
      this.emit('close', code);
      // Reject any pending requests
      for (const [id, req] of this.pendingRequests.entries()) {
        clearTimeout(req.timeout);
        req.reject(new Error(`Pi process terminated (code ${code}): ${this.lastExitError}`));
      }
      this.pendingRequests.clear();
    });

    // Wait slightly to verify spawn succeeded and did not immediately crash
    await new Promise((r) => setTimeout(r, 800));

    if (!this.isAlive || !this.child) {
      throw new Error(`Pi process failed to start: ${this.lastExitError || 'Immediate exit'}`);
    }
  }

  public async ensureAlive(): Promise<void> {
    if (this.alive) return;
    const opts: PiProcessOptions = this.lastStartOptions || {
      cwd: this.currentCwd || os.homedir(),
      approveLocal: true
    };
    await this.start(opts);
  }

  public async stop(): Promise<void> {
    if (!this.child) return;
    
    try {
      if (this.isAlive) {
        // Try graceful abort first
        try {
          await this.sendRpcCommand('abort', {}, 1000);
        } catch {
          // ignore
        }
      }
    } finally {
      this.isAlive = false;
      this.child.kill();
      this.child = null;
    }
  }

  /**
   * Protocol-compliant LF line buffering.
   * Splits strictly on \n, strips trailing \r.
   * Does not break on Unicode separators U+2028 or U+2029.
   */
  private handleStdoutChunk(chunk: Buffer) {
    this.lineBuffer += chunk.toString('utf8');
    
    let newlineIndex: number;
    while ((newlineIndex = this.lineBuffer.indexOf('\n')) !== -1) {
      let line = this.lineBuffer.slice(0, newlineIndex);
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }

      line = line.trim();
      if (!line) continue;

      this.parseAndDispatchLine(line);
    }
  }

  private parseAndDispatchLine(line: string) {
    try {
      const payload = JSON.parse(line);
      
      // Check if this is an extension UI request
      if (payload.type === 'extension_ui_request') {
        this.emit('extension_ui_request', payload as ExtensionUiRequest);
        return;
      }

      // Check if this is a response to an RPC command
      if (payload.type === 'response') {
        if (payload.id && this.pendingRequests.has(payload.id)) {
          const req = this.pendingRequests.get(payload.id)!;
          clearTimeout(req.timeout);
          this.pendingRequests.delete(payload.id);

          if (payload.success) {
            req.resolve(payload.data ?? payload);
          } else {
            req.reject(new Error(payload.error || 'Command failed'));
          }
          return;
        }
      }

      // Streamed event
      this.emit('event', payload);
      if (payload.type) {
        this.emit(payload.type, payload);
      }
    } catch (err) {
      // Non-JSON stdout (e.g. extension logs or warnings)
      this.emit('stdout_raw', line);
    }
  }

  public async sendRpcCommand<T = any>(command: string, params: Record<string, any> = {}, timeoutMs = 45000): Promise<T> {
    if (!this.child || !this.child.stdin || !this.isAlive) {
      try {
        await this.ensureAlive();
      } catch (err: any) {
        throw new Error(`Pi process is not running: ${err.message || this.lastExitError || 'Failed to start Pi agent'}`);
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.child || !this.child.stdin || !this.isAlive) {
        return reject(new Error(`Pi process is not running: ${this.lastExitError || 'Process not ready'}`));
      }

      const id = `req-${++this.requestIdCounter}-${Date.now()}`;
      const payload = {
        id,
        type: command,
        ...params
      };

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Command '${command}' timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const jsonString = JSON.stringify(payload) + '\n';
      this.child.stdin.write(jsonString, 'utf8', (err) => {
        if (err) {
          clearTimeout(timeout);
          this.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }

  public sendUiResponse(response: ExtensionUiResponse): void {
    if (!this.child || !this.child.stdin || !this.isAlive) return;
    const jsonString = JSON.stringify(response) + '\n';
    this.child.stdin.write(jsonString, 'utf8');
  }

  // High-level Pi RPC helpers
  public async prompt(message: string, images?: any[], streamingBehavior?: 'steer' | 'followUp'): Promise<any> {
    return this.sendRpcCommand('prompt', { message, images, streamingBehavior });
  }

  public async steer(message: string, images?: any[]): Promise<any> {
    return this.sendRpcCommand('steer', { message, images });
  }

  public async followUp(message: string, images?: any[]): Promise<any> {
    return this.sendRpcCommand('follow_up', { message, images });
  }

  public async abort(): Promise<any> {
    return this.sendRpcCommand('abort', {}, 5000);
  }

  public async clearQueue(): Promise<any> {
    return this.sendRpcCommand('clear_queue', {}, 5000);
  }

  public async getState(): Promise<PiSessionState> {
    return this.sendRpcCommand('get_state', {}, 8000);
  }

  public async getMessages(): Promise<{ messages: PiMessage[] }> {
    return this.sendRpcCommand('get_messages', {}, 8000);
  }

  public async getAvailableModels(): Promise<{ models: any[] }> {
    return this.sendRpcCommand('get_available_models', {}, 8000);
  }

  public async setModel(provider: string, modelId: string): Promise<any> {
    return this.sendRpcCommand('set_model', { provider, modelId });
  }

  public async cycleModel(): Promise<any> {
    return this.sendRpcCommand('cycle_model');
  }

  public async setThinkingLevel(level: string): Promise<any> {
    return this.sendRpcCommand('set_thinking_level', { level });
  }

  public async getAvailableThinkingLevels(): Promise<{ levels: string[] }> {
    return this.sendRpcCommand('get_available_thinking_levels', {}, 5000);
  }

  public async newSession(parentSession?: string): Promise<any> {
    return this.sendRpcCommand('new_session', { parentSession });
  }

  public async switchSession(sessionPath: string): Promise<any> {
    return this.sendRpcCommand('switch_session', { sessionPath });
  }

  public async fork(entryId: string): Promise<any> {
    return this.sendRpcCommand('fork', { entryId });
  }

  public async clone(): Promise<any> {
    return this.sendRpcCommand('clone');
  }

  public async getEntries(since?: string): Promise<any> {
    return this.sendRpcCommand('get_entries', { since });
  }

  public async getTree(): Promise<any> {
    return this.sendRpcCommand('get_tree');
  }

  public async getCommands(): Promise<{ commands: any[] }> {
    return this.sendRpcCommand('get_commands');
  }

  public async compact(customInstructions?: string): Promise<any> {
    return this.sendRpcCommand('compact', { customInstructions }, 60000);
  }

  public async getSessionStats(): Promise<any> {
    return this.sendRpcCommand('get_session_stats');
  }

  public async executeBash(command: string): Promise<any> {
    return this.sendRpcCommand('bash', { command }, 120000);
  }

  public async abortBash(): Promise<any> {
    return this.sendRpcCommand('abort_bash');
  }

  public async setSessionName(name: string): Promise<any> {
    return this.sendRpcCommand('set_session_name', { name });
  }
}
