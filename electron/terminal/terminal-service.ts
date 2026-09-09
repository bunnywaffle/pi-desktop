import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as os from 'os';

export class TerminalService extends EventEmitter {
  private child: ChildProcess | null = null;

  public start(cwd: string): void {
    if (this.child) {
      this.child.kill();
    }

    const isWin = os.platform() === 'win32';
    const shell = isWin ? 'powershell.exe' : (process.env.SHELL || 'bash');

    this.child = spawn(shell, [], {
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLUMNS: '100',
        LINES: '30'
      }
    });

    this.child.stdout?.on('data', (d) => {
      this.emit('data', d.toString('utf8'));
    });

    this.child.stderr?.on('data', (d) => {
      this.emit('data', d.toString('utf8'));
    });

    this.child.on('close', (code) => {
      this.emit('close', code);
      this.child = null;
    });

    this.child.on('error', (err) => {
      this.emit('error', err);
    });
  }

  public write(data: string): void {
    if (this.child && this.child.stdin && !this.child.killed) {
      this.child.stdin.write(data);
    }
  }

  public stop(): void {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
  }
}
