import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PiSessionSummary } from '../../src/types/pi';

export class SessionManager {
  public static getSessionStorageDir(): string {
    if (process.env.PI_CODING_AGENT_SESSION_DIR) {
      return process.env.PI_CODING_AGENT_SESSION_DIR;
    }
    const agentDir = process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), '.pi', 'agent');
    return path.join(agentDir, 'sessions');
  }

  public static encodeProjectPath(projectPath: string): string {
    // Replaces / and \ and : with -
    const normalized = projectPath.replace(/^[a-zA-Z]:/, (match) => match[0].toUpperCase());
    const sanitized = normalized.replace(/[/\\:]+/g, '-').replace(/^-+|-+$/g, '');
    return `--${sanitized}--`;
  }

  public static async getSessionsForProject(projectPath: string): Promise<PiSessionSummary[]> {
    const baseDir = this.getSessionStorageDir();
    const encoded = this.encodeProjectPath(projectPath);
    const targetDir = path.join(baseDir, encoded);

    if (!fs.existsSync(targetDir)) {
      // Also check fuzzy match in baseDir
      return this.fuzzyFindProjectSessions(baseDir, projectPath);
    }

    return this.readSessionsInDirectory(targetDir);
  }

  private static fuzzyFindProjectSessions(baseDir: string, projectPath: string): PiSessionSummary[] {
    if (!fs.existsSync(baseDir)) return [];
    try {
      const entries = fs.readdirSync(baseDir, { withFileTypes: true });
      const projectName = path.basename(projectPath).toLowerCase();

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.toLowerCase().includes(projectName)) {
          return this.readSessionsInDirectory(path.join(baseDir, entry.name));
        }
      }
    } catch {
      // Ignore
    }
    return [];
  }

  public static async getAllRecentSessions(): Promise<Array<PiSessionSummary & { projectDir: string }>> {
    const baseDir = this.getSessionStorageDir();
    if (!fs.existsSync(baseDir)) return [];

    const results: Array<PiSessionSummary & { projectDir: string }> = [];

    try {
      const dirs = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const sessions = this.readSessionsInDirectory(path.join(baseDir, dir.name));
          for (const s of sessions) {
            results.push({
              ...s,
              projectDir: s.cwd || dir.name.replace(/^--|--$/g, '').replace(/-/g, path.sep)
            });
          }
        }
      }
    } catch {
      // Ignore
    }

    // Sort by timestamp desc
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  private static readSessionsInDirectory(dirPath: string): PiSessionSummary[] {
    const sessions: PiSessionSummary[] = [];
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const fullPath = path.join(dirPath, file);
          const summary = this.parseSessionFile(fullPath);
          if (summary) {
            sessions.push(summary);
          }
        }
      }
    } catch {
      // Ignore
    }
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  }

  public static parseSessionFile(filePath: string): PiSessionSummary | null {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

      let sessionName: string | undefined;
      let lastMessage: string | undefined;
      let model: string | undefined;
      let thinkingLevel: string | undefined;
      let sessionCwd: string | undefined;
      let userCount = 0;

      for (let i = 0; i < lines.length; i++) {
        try {
          const obj = JSON.parse(lines[i]);
          if (obj.type === 'session' && obj.cwd) {
            sessionCwd = obj.cwd;
          }
          if (obj.type === 'session_name' || obj.type === 'name') {
            sessionName = obj.name;
          }
          if (obj.type === 'header') {
            if (obj.model) model = obj.model;
          }
          if (obj.type === 'model_change' && obj.modelId) {
            model = obj.modelId;
          }
          if (obj.type === 'thinking_level_change' && obj.thinkingLevel) {
            thinkingLevel = obj.thinkingLevel;
          }
          if (obj.type === 'message' && obj.message) {
            userCount++;
            if (obj.message.role === 'user') {
              const text = typeof obj.message.content === 'string'
                ? obj.message.content
                : Array.isArray(obj.message.content)
                  ? obj.message.content.find((c: any) => c.type === 'text')?.text || ''
                  : '';
              if (!sessionName && text) {
                sessionName = text.slice(0, 40);
              }
              lastMessage = text;
            } else if (obj.message.role === 'assistant') {
              if (obj.message.model) model = obj.message.model;
            }
          }
        } catch {
          // ignore bad line
        }
      }

      return {
        id: path.basename(filePath, '.jsonl'),
        path: filePath,
        name: sessionName || path.basename(filePath, '.jsonl').slice(0, 24),
        timestamp: stats.mtimeMs,
        lastMessage: lastMessage ? lastMessage.slice(0, 100) : undefined,
        model,
        thinkingLevel,
        messageCount: userCount,
        cwd: sessionCwd
      };
    } catch {
      return null;
    }
  }

  public static readSessionMessages(filePath: string): any[] {
    try {
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      const messages: any[] = [];

      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'message' && obj.message) {
            messages.push({
              id: obj.id,
              role: obj.message.role,
              content: obj.message.content,
              model: obj.message.model,
              errorMessage: obj.message.errorMessage,
              timestamp: obj.timestamp ? new Date(obj.timestamp).getTime() : Date.now()
            });
          }
        } catch {
          // ignore
        }
      }
      return messages;
    } catch {
      return [];
    }
  }


  public static async deleteSession(sessionPath: string): Promise<boolean> {
    try {
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static async renameSession(sessionPath: string, newName: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fs.existsSync(sessionPath)) {
        return { success: false, error: 'Session file not found' };
      }
      // In Pi sessions, session_name can be recorded by appending a session_name entry
      const entry = JSON.stringify({ type: 'session_name', name: newName.trim(), timestamp: Date.now() });
      fs.appendFileSync(sessionPath, `\n${entry}\n`, 'utf8');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static async forkSession(sessionPath: string): Promise<{ success: boolean; newPath?: string; error?: string }> {
    try {
      if (!fs.existsSync(sessionPath)) {
        return { success: false, error: 'Source session file not found' };
      }
      const dir = path.dirname(sessionPath);
      const ext = path.extname(sessionPath);
      const base = path.basename(sessionPath, ext);
      const newPath = path.join(dir, `${base}-fork-${Date.now()}${ext}`);
      fs.copyFileSync(sessionPath, newPath);
      return { success: true, newPath };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static async exportSession(sessionPath: string, targetPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!fs.existsSync(sessionPath)) {
        return { success: false, error: 'Session file not found' };
      }
      // Use child_process to execute pi --export session.jsonl target.html
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync(`pi --export "${sessionPath}" "${targetPath}"`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }
}

