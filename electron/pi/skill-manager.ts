import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PiSkill } from '../../src/types/pi';

export class SkillManager {
  public static async discoverSkills(projectDir?: string): Promise<PiSkill[]> {
    const skills: PiSkill[] = [];
    const home = os.homedir();

    // 1. Global ~/.pi/agent/skills and ~/.agents/skills
    const globalDirs = [
      path.join(home, '.pi', 'agent', 'skills'),
      path.join(home, '.agents', 'skills')
    ];
    for (const dir of globalDirs) {
      if (fs.existsSync(dir)) {
        skills.push(...this.scanSkillDirectory(dir, 'global'));
      }
    }

    // 2. Project skills .pi/skills and .agents/skills
    if (projectDir) {
      const projectDirs = [
        path.join(projectDir, '.pi', 'skills'),
        path.join(projectDir, '.agents', 'skills')
      ];
      for (const dir of projectDirs) {
        if (fs.existsSync(dir)) {
          skills.push(...this.scanSkillDirectory(dir, 'project'));
        }
      }
    }

    // 3. Package skills from ~/.pi/agent/npm and git
    const npmDir = path.join(home, '.pi', 'agent', 'npm');
    if (fs.existsSync(npmDir)) {
      skills.push(...this.scanPackageSkills(npmDir));
    }

    return skills;
  }

  private static scanSkillDirectory(dir: string, source: 'global' | 'project'): PiSkill[] {
    const list: PiSkill[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const skillMdPath = path.join(fullPath, 'SKILL.md');
          if (fs.existsSync(skillMdPath)) {
            const parsed = this.parseSkillFile(skillMdPath);
            list.push({
              name: parsed.name || entry.name,
              description: parsed.description || 'Custom skill',
              source,
              path: fullPath,
              enabled: true,
              content: parsed.content,
              frontmatter: parsed.frontmatter
            });
          }
        } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
          const parsed = this.parseSkillFile(fullPath);
          if (parsed.frontmatter && parsed.frontmatter.description) {
            list.push({
              name: parsed.name || path.basename(entry.name, '.md'),
              description: parsed.description,
              source,
              path: fullPath,
              enabled: true,
              content: parsed.content,
              frontmatter: parsed.frontmatter
            });
          }
        }
      }
    } catch {
      // Ignore scan errors
    }
    return list;
  }

  private static scanPackageSkills(npmDir: string): PiSkill[] {
    const list: PiSkill[] = [];
    try {
      const subdirs = fs.readdirSync(npmDir, { withFileTypes: true });
      for (const sub of subdirs) {
        if (sub.isDirectory()) {
          const skillsSubdir = path.join(npmDir, sub.name, 'skills');
          if (fs.existsSync(skillsSubdir)) {
            const scanned = this.scanSkillDirectory(skillsSubdir, 'global');
            for (const s of scanned) {
              s.source = 'package';
              s.packageName = sub.name;
              list.push(s);
            }
          }
        }
      }
    } catch {
      // Ignore
    }
    return list;
  }

  public static parseSkillFile(filePath: string): { name: string; description: string; content: string; frontmatter: Record<string, any> } {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
      const match = raw.match(frontmatterRegex);

      if (!match) {
        return { name: path.basename(filePath, '.md'), description: '', content: raw, frontmatter: {} };
      }

      const fmText = match[1];
      const content = raw.slice(match[0].length).trim();
      const fm: Record<string, any> = {};

      for (const line of fmText.split(/\r?\n/)) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim();
          const val = line.slice(colonIndex + 1).trim();
          fm[key] = val;
        }
      }

      return {
        name: fm.name || path.basename(filePath, '.md'),
        description: fm.description || '',
        content,
        frontmatter: fm
      };
    } catch {
      return { name: path.basename(filePath, '.md'), description: '', content: '', frontmatter: {} };
    }
  }

  public static async createSkill(params: {
    name: string;
    description: string;
    instructions: string;
    scope: 'global' | 'project';
    projectDir?: string;
    scripts?: Array<{ filename: string; content: string }>;
    references?: Array<{ filename: string; content: string }>;
  }): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const baseDir = params.scope === 'project' && params.projectDir
        ? path.join(params.projectDir, '.pi', 'skills')
        : path.join(os.homedir(), '.pi', 'agent', 'skills');

      const skillFolder = path.join(baseDir, params.name);
      fs.mkdirSync(skillFolder, { recursive: true });

      const frontmatter = [
        '---',
        `name: ${params.name}`,
        `description: ${params.description}`,
        '---',
        '',
        params.instructions
      ].join('\n');

      fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), frontmatter, 'utf8');

      if (params.scripts && params.scripts.length > 0) {
        const scriptsDir = path.join(skillFolder, 'scripts');
        fs.mkdirSync(scriptsDir, { recursive: true });
        for (const s of params.scripts) {
          fs.writeFileSync(path.join(scriptsDir, s.filename), s.content, 'utf8');
        }
      }

      if (params.references && params.references.length > 0) {
        const refsDir = path.join(skillFolder, 'references');
        fs.mkdirSync(refsDir, { recursive: true });
        for (const r of params.references) {
          fs.writeFileSync(path.join(refsDir, r.filename), r.content, 'utf8');
        }
      }

      return { success: true, path: skillFolder };
    } catch (err: any) {
      return { success: false, path: '', error: err.message || String(err) };
    }
  }

  public static async deleteSkill(skillPath: string): Promise<boolean> {
    try {
      if (fs.existsSync(skillPath)) {
        fs.rmSync(skillPath, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
