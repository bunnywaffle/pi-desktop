import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { shell } from 'electron';
import { PiProject } from '../../src/types/pi';
import { SessionManager } from './session-manager';

const execAsync = promisify(exec);

export class ProjectManager {
  private static recentProjectsKey = path.join(os.homedir(), '.pi', 'agent', 'recent-projects.json');

  public static decodeProjectPath(dirName: string): string {
    const trimmed = dirName.replace(/^--|--$/g, '');
    const isWin = os.platform() === 'win32';

    if (isWin) {
      const match = trimmed.match(/^([a-zA-Z])-(.*)$/);
      if (match) {
        const drive = match[1].toUpperCase() + ':';
        const rest = match[2].replace(/-/g, path.sep);
        return `${drive}\\${rest}`;
      }
    }
    return trimmed.replace(/-/g, path.sep);
  }

  public static async getRecentProjects(): Promise<PiProject[]> {
    const list: string[] = [];

    // By default, projects list is strictly user-controlled.
    // Only load projects that the user has explicitly added/opened.
    if (fs.existsSync(this.recentProjectsKey)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.recentProjectsKey, 'utf8'));
        if (Array.isArray(saved)) {
          for (const p of saved) {
            if (fs.existsSync(p) && !list.includes(p)) {
              list.push(p);
            }
          }
        }
      } catch {
        // Ignore
      }
    }

    const projects: PiProject[] = [];
    for (const p of list) {
      if (fs.existsSync(p)) {
        const proj = await this.inspectProject(p);
        projects.push(proj);
      }
    }

    return projects;
  }

  public static async addRecentProject(projectPath: string): Promise<void> {
    const existing = await this.getRecentProjects();
    const paths = Array.from(new Set([projectPath, ...existing.map(p => p.path)])).slice(0, 25);
    try {
      const parent = path.dirname(this.recentProjectsKey);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(this.recentProjectsKey, JSON.stringify(paths, null, 2), 'utf8');
    } catch {
      // Ignore
    }
  }

  public static async removeRecentProject(projectPath: string): Promise<void> {
    const existing = await this.getRecentProjects();
    const paths = existing.map(p => p.path).filter(p => p !== projectPath);
    try {
      fs.writeFileSync(this.recentProjectsKey, JSON.stringify(paths, null, 2), 'utf8');
    } catch {
      // Ignore
    }
  }

  public static async createProjectFolder(parentDir: string, folderName: string): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const target = path.join(parentDir, folderName);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      await this.addRecentProject(target);
      return { success: true, path: target };
    } catch (err: any) {
      return { success: false, path: '', error: err.message || String(err) };
    }
  }

  public static async deleteProject(projectPath: string): Promise<boolean> {
    try {
      await this.removeRecentProject(projectPath);

      // Also clean up session files for this project in ~/.pi/agent/sessions
      const sessionsBase = SessionManager.getSessionStorageDir();
      const encoded = SessionManager.encodeProjectPath(projectPath);
      const targetSessionDir = path.join(sessionsBase, encoded);
      if (fs.existsSync(targetSessionDir)) {
        fs.rmSync(targetSessionDir, { recursive: true, force: true });
      }

      return true;
    } catch {
      return false;
    }
  }

  public static openInExplorer(targetPath: string): void {
    if (fs.existsSync(targetPath)) {
      shell.showItemInFolder(targetPath);
    }
  }

  public static async inspectProject(projectPath: string): Promise<PiProject> {
    const isGit = fs.existsSync(path.join(projectPath, '.git'));
    let branch = 'master';

    if (isGit) {
      try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath });
        branch = stdout.trim() || 'master';
      } catch {
        branch = 'main';
      }
    }

    const sessions = await SessionManager.getSessionsForProject(projectPath);

    return {
      name: path.basename(projectPath) || projectPath,
      path: projectPath,
      branch,
      isGit,
      trusted: true,
      sessions
    };
  }
}
