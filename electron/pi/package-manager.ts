import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PiPackage } from '../../src/types/pi';

const execAsync = promisify(exec);

export class PackageManager {
  public static async getInstalledPackages(projectDir?: string): Promise<{ global: PiPackage[]; project: PiPackage[] }> {
    const globalSettingsPath = path.join(os.homedir(), '.pi', 'agent', 'settings.json');
    const projectSettingsPath = projectDir ? path.join(projectDir, '.pi', 'settings.json') : null;

    const globalPkgs = await this.readPackagesFromSettings(globalSettingsPath, 'global');
    const projectPkgs = projectSettingsPath ? await this.readPackagesFromSettings(projectSettingsPath, 'project') : [];

    return { global: globalPkgs, project: projectPkgs };
  }

  private static async readPackagesFromSettings(settingsPath: string, scope: 'global' | 'project'): Promise<PiPackage[]> {
    if (!fs.existsSync(settingsPath)) return [];

    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(content);
      const rawPackages = settings.packages || [];

      const packages: PiPackage[] = [];
      for (const item of rawPackages) {
        if (typeof item === 'string') {
          packages.push({
            name: this.extractPackageName(item),
            source: item,
            scope,
            enabled: true
          });
        } else if (typeof item === 'object' && item.source) {
          packages.push({
            name: this.extractPackageName(item.source),
            source: item.source,
            scope,
            extensions: item.extensions,
            skills: item.skills,
            prompts: item.prompts,
            themes: item.themes,
            enabled: true
          });
        }
      }
      return packages;
    } catch {
      return [];
    }
  }

  public static extractPackageName(source: string): string {
    if (source.startsWith('npm:')) {
      const spec = source.slice(4);
      // Strip version @...
      const atIndex = spec.lastIndexOf('@');
      return atIndex > 0 ? spec.slice(0, atIndex) : spec;
    }
    if (source.startsWith('git:') || source.startsWith('https://')) {
      const parts = source.split('/');
      const last = parts[parts.length - 1];
      return last.replace(/\.git$/, '').split('@')[0];
    }
    return path.basename(source);
  }

  public static async installPackage(source: string, isProjectScope: boolean, projectDir?: string): Promise<{ success: boolean; output: string }> {
    const scopeFlag = isProjectScope ? '-l' : '';
    const cwd = isProjectScope && projectDir ? projectDir : os.homedir();
    
    try {
      const cmd = `pi install "${source}" ${scopeFlag}`.trim();
      const { stdout, stderr } = await execAsync(cmd, { cwd });
      return { success: true, output: (stdout + '\n' + stderr).trim() };
    } catch (err: any) {
      return { success: false, output: err.message || String(err) };
    }
  }

  public static async removePackage(source: string, isProjectScope: boolean, projectDir?: string): Promise<{ success: boolean; output: string }> {
    const scopeFlag = isProjectScope ? '-l' : '';
    const cwd = isProjectScope && projectDir ? projectDir : os.homedir();

    try {
      const cmd = `pi remove "${source}" ${scopeFlag}`.trim();
      const { stdout, stderr } = await execAsync(cmd, { cwd });
      return { success: true, output: (stdout + '\n' + stderr).trim() };
    } catch (err: any) {
      return { success: false, output: err.message || String(err) };
    }
  }

  public static async updatePackage(source?: string): Promise<{ success: boolean; output: string }> {
    try {
      const cmd = source ? `pi update "${source}"` : 'pi update --all';
      const { stdout, stderr } = await execAsync(cmd);
      return { success: true, output: (stdout + '\n' + stderr).trim() };
    } catch (err: any) {
      return { success: false, output: err.message || String(err) };
    }
  }

  public static getPopularPackages(): Array<{ name: string; source: string; description: string; resources: string; category?: string }> {
    return [
      {
        name: 'pi-mcp-adapter',
        source: 'npm:pi-mcp-adapter',
        description: 'Model Context Protocol (MCP) tool integration and server bridge for connecting external tools',
        resources: '1 extension, MCP bridge',
        category: 'Extensions'
      },
      {
        name: 'pi-web-access',
        source: 'npm:pi-web-access',
        description: 'Web search and web page markdown extraction tools for real-time web research',
        resources: '1 tool, 2 skills',
        category: 'Tools'
      },
      {
        name: 'pi-subagents',
        source: 'npm:pi-subagents',
        description: 'Multi-agent orchestration: invoke, branch, and coordinate parallel subagents',
        resources: '1 tool, 1 extension',
        category: 'Extensions'
      },
      {
        name: '@companion-ai/feynman',
        source: 'npm:@companion-ai/feynman',
        description: 'Interactive coding mentor and deep Socratic learning assistant',
        resources: '2 skills, 1 prompt',
        category: 'Skills'
      },
      {
        name: '@juicesharp/rpiv-ask-user-question',
        source: 'npm:@juicesharp/rpiv-ask-user-question',
        description: 'Interactive question dialogue bridge to clarify ambiguous requirements with users',
        resources: '1 tool, UI bridge',
        category: 'Tools'
      },
      {
        name: 'pi-background-tasks',
        source: 'npm:pi-background-tasks',
        description: 'Run long commands, test suites, and daemons in background without blocking interaction',
        resources: '1 tool, 1 extension',
        category: 'Tools'
      },
      {
        name: '@juicesharp/rpiv-todo',
        source: 'npm:@juicesharp/rpiv-todo',
        description: 'Real-time session todo list and task management widget tracking',
        resources: '1 tool, 1 widget',
        category: 'Tools'
      },
      {
        name: '@henryqw/pi-multi-codex',
        source: 'npm:@henryqw/pi-multi-codex',
        description: 'Multi-repository code indexer and cross-codebase semantic reference system',
        resources: '2 tools, 1 skill',
        category: 'Tools'
      },
      {
        name: '@mjasnikovs/pi-task',
        source: 'npm:@mjasnikovs/pi-task',
        description: 'Structured task planning, execution checklist, and goal tracking',
        resources: '1 extension, 1 skill',
        category: 'Skills'
      },
      {
        name: 'pi-goimports',
        source: 'npm:pi-goimports',
        description: 'Automatic Go language import resolution, formatting, and analysis',
        resources: '1 tool, 1 extension',
        category: 'Tools'
      },
      {
        name: '@draig/lexis-two',
        source: 'npm:@draig/lexis-two',
        description: 'Lexical analysis, syntax inspection, and automated API documentation generation',
        resources: '2 skills, 1 tool',
        category: 'Skills'
      },
      {
        name: '@selesai/code',
        source: 'npm:@selesai/code',
        description: 'Comprehensive code review, static code analysis, and style linting assistant',
        resources: '1 skill, 1 prompt',
        category: 'Skills'
      },
      {
        name: 'pi-better-harness',
        source: 'npm:pi-better-harness',
        description: 'Agent evaluation, benchmark suites, and testing harness for Pi workflows',
        resources: '2 tools, 1 extension',
        category: 'Extensions'
      },
      {
        name: 'pi-message-sidebar',
        source: 'npm:pi-message-sidebar',
        description: 'Sidebar widgets and status notifications for background event alerts',
        resources: '1 extension, 1 widget',
        category: 'Extensions'
      },
      {
        name: 'pi-better-subagents',
        source: 'npm:pi-better-subagents',
        description: 'Enhanced subagent coordination with isolated workspace branches',
        resources: '1 tool, 1 extension',
        category: 'Extensions'
      },
      {
        name: 'pi-bansos',
        source: 'npm:pi-bansos',
        description: 'Catalog of 24+ free & community AI models via OpenCode and Kilo',
        resources: '1 extension, model provider',
        category: 'Providers'
      },
      {
        name: '@complexthings/pi-dynamic-context-pruning',
        source: 'npm:@complexthings/pi-dynamic-context-pruning',
        description: 'Smart context window management, message compaction, and token optimizer',
        resources: '1 extension',
        category: 'Extensions'
      },
      {
        name: 'pi-goal-x',
        source: 'npm:pi-goal-x',
        description: 'Autonomous goal execution and multi-turn planning harness',
        resources: '1 extension, 1 prompt',
        category: 'Extensions'
      },
      {
        name: '@dietrichgebert/ponytail',
        source: 'npm:@dietrichgebert/ponytail',
        description: 'Developer utilities, git branch assistance, and diff helpers',
        resources: '3 extensions, 2 skills',
        category: 'Tools'
      }
    ];
  }
}
