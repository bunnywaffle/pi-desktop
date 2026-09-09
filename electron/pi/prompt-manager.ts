import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PiPromptTemplate } from '../../src/types/pi';

export class PromptManager {
  public static async discoverPrompts(projectDir?: string): Promise<PiPromptTemplate[]> {
    const prompts: PiPromptTemplate[] = [];
    const home = os.homedir();

    const globalDir = path.join(home, '.pi', 'agent', 'prompts');
    if (fs.existsSync(globalDir)) {
      prompts.push(...this.scanPromptsInDir(globalDir, 'global'));
    }

    if (projectDir) {
      const projectDirPrompts = path.join(projectDir, '.pi', 'prompts');
      if (fs.existsSync(projectDirPrompts)) {
        prompts.push(...this.scanPromptsInDir(projectDirPrompts, 'project'));
      }
    }

    return prompts;
  }

  private static scanPromptsInDir(dir: string, scope: 'global' | 'project'): PiPromptTemplate[] {
    const result: PiPromptTemplate[] = [];
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          result.push({
            name: path.basename(file, '.md'),
            path: filePath,
            scope,
            content
          });
        }
      }
    } catch {
      // Ignore
    }
    return result;
  }

  public static async savePrompt(name: string, content: string, scope: 'global' | 'project', projectDir?: string): Promise<boolean> {
    try {
      const baseDir = scope === 'project' && projectDir
        ? path.join(projectDir, '.pi', 'prompts')
        : path.join(os.homedir(), '.pi', 'agent', 'prompts');

      fs.mkdirSync(baseDir, { recursive: true });
      fs.writeFileSync(path.join(baseDir, `${name}.md`), content, 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  public static async deletePrompt(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
