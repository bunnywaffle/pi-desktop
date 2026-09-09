import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { shell } from 'electron';
import { PiExtension } from '../../src/types/pi';
import { SettingsManager } from './settings-manager';

export class ExtensionManager {
  public static getPiAgentDir(): string {
    return process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), '.pi', 'agent');
  }

  public static getGlobalExtensionsDir(): string {
    return path.join(this.getPiAgentDir(), 'extensions');
  }

  public static getProjectExtensionsDir(projectDir: string): string {
    return path.join(projectDir, '.pi', 'extensions');
  }

  public static async listExtensions(projectDir?: string): Promise<PiExtension[]> {
    const extensions: Map<string, PiExtension> = new Map();

    const globalSettings = SettingsManager.readSettings('global');
    const projectSettings = projectDir ? SettingsManager.readSettings('project', projectDir) : {};

    const disabledList = new Set<string>();
    const checkDisabled = (list?: any[]) => {
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (typeof item === 'string' && item.startsWith('-')) {
          const clean = item.slice(1).replace(/^extensions[/\\]/, '').trim();
          disabledList.add(clean);
          disabledList.add(item.slice(1).trim());
        }
      }
    };
    checkDisabled(globalSettings.extensions);
    checkDisabled(projectSettings.extensions);

    // 1. Scan Global Extensions Directory (~/.pi/agent/extensions)
    const globalDir = this.getGlobalExtensionsDir();
    if (fs.existsSync(globalDir)) {
      try {
        const files = fs.readdirSync(globalDir, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile() && /\.(ts|js|mjs)$/i.test(file.name)) {
            const extName = file.name;
            const fullPath = path.join(globalDir, file.name);
            const desc = this.extractDescription(fullPath);
            const isDis = disabledList.has(extName) ||
              disabledList.has(`extensions/${extName}`) ||
              disabledList.has(`extensions\\${extName}`);
            const savedOpts = SettingsManager.getExtensionOptions(extName);
            const enabled = savedOpts?.enabled !== undefined ? savedOpts.enabled : !isDis;

            extensions.set(extName, {
              name: extName,
              source: `~/.pi/agent/extensions/${extName}`,
              path: fullPath,
              status: enabled ? 'enabled' : 'disabled',
              location: 'global',
              description: desc || 'Custom TypeScript/JavaScript extension script'
            });
          }
        }
      } catch (err) {
        console.error('Error scanning global extensions dir:', err);
      }
    }

    // 2. Scan Project Extensions Directory (<project>/.pi/extensions)
    if (projectDir) {
      const projDir = this.getProjectExtensionsDir(projectDir);
      if (fs.existsSync(projDir)) {
        try {
          const files = fs.readdirSync(projDir, { withFileTypes: true });
          for (const file of files) {
            if (file.isFile() && /\.(ts|js|mjs)$/i.test(file.name)) {
              const extName = file.name;
              const fullPath = path.join(projDir, file.name);
              const desc = this.extractDescription(fullPath);
              const isDis = disabledList.has(extName) ||
                disabledList.has(`extensions/${extName}`) ||
                disabledList.has(`extensions\\${extName}`);
              const savedOpts = SettingsManager.getExtensionOptions(extName);
              const enabled = savedOpts?.enabled !== undefined ? savedOpts.enabled : !isDis;

              extensions.set(`proj:${extName}`, {
                name: extName,
                source: `.pi/extensions/${extName}`,
                path: fullPath,
                status: enabled ? 'enabled' : 'disabled',
                location: 'project',
                description: desc || 'Project-scoped extension script'
              });
            }
          }
        } catch (err) {
          console.error('Error scanning project extensions dir:', err);
        }
      }
    }

    // 3. Scan Installed Packages from settings
    const allPackages = [
      ...(Array.isArray(globalSettings.packages) ? globalSettings.packages : []),
      ...(Array.isArray(projectSettings.packages) ? projectSettings.packages : [])
    ];

    for (const pkg of allPackages) {
      const pkgSource = typeof pkg === 'string' ? pkg : pkg?.source;
      if (!pkgSource) continue;

      const rawName = pkgSource.startsWith('npm:') ? pkgSource.slice(4) : pkgSource;
      const cleanName = rawName.replace(/@[^/]+$/, ''); // remove version suffix if any
      const isDis = disabledList.has(cleanName) || disabledList.has(pkgSource);
      const savedOpts = SettingsManager.getExtensionOptions(cleanName);
      const enabled = savedOpts?.enabled !== undefined ? savedOpts.enabled : !isDis;

      // Check if we haven't already registered an extension with this name
      if (!extensions.has(cleanName)) {
        extensions.set(cleanName, {
          name: cleanName,
          source: pkgSource,
          status: enabled ? 'enabled' : 'disabled',
          location: 'package',
          description: this.getPackageDescription(cleanName)
        });
      }
    }

    return Array.from(extensions.values());
  }

  public static async toggleExtension(
    name: string,
    enable: boolean,
    projectDir?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const scope = projectDir ? 'project' : 'global';
      const settings = SettingsManager.readSettings(scope, projectDir);
      let extList: string[] = Array.isArray(settings.extensions) ? [...settings.extensions] : [];

      // Remove any existing variant of this extension from the list
      extList = extList.filter(item => {
        const clean = item.replace(/^[-+]/, '').replace(/^extensions[/\\]/, '');
        return clean !== name;
      });

      if (!enable) {
        // Add disable flag
        extList.push(`-extensions\\${name}`);
      }

      settings.extensions = extList;
      SettingsManager.saveSettings(settings, scope, projectDir);

      // Also persist to extension options
      SettingsManager.saveExtensionOptions(name, { enabled: enable });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static async openExtensionsFolder(): Promise<boolean> {
    const dir = this.getGlobalExtensionsDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const res = await shell.openPath(dir);
    return res === '';
  }

  private static extractDescription(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8').slice(0, 800);
      const match = content.match(/\/\*\*?[\s\S]*?@description\s+([^\r\n*]+)/i) ||
                    content.match(/\/\/\s*Description:\s*([^\r\n]+)/i) ||
                    content.match(/^\/\/\s*([^\r\n]+)/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch {}
    return null;
  }

  private static getPackageDescription(pkgName: string): string {
    // 1. Try reading real description from installed package.json on disk
    try {
      const nodeModulesDir = path.join(this.getPiAgentDir(), 'npm', 'node_modules');
      const pkgJsonPath = path.join(nodeModulesDir, pkgName, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkgJson.description) {
          return pkgJson.description;
        }
      }
    } catch {}

    const knownMap: Record<string, string> = {
      'pi-bansos': 'Free API provider extension for OpenRouter, Cerebras, and Groq models',
      'pi-mcp-adapter': 'Model Context Protocol (MCP) bridge for integrating external tools',
      'pi-web-access': 'Real-time web search and content reading tools',
      '@complexthings/pi-dynamic-context-pruning': 'Adaptive context window and token optimization',
      'pi-goal-x': 'Autonomous goal planning and execution loop runner',
      '@dietrichgebert/ponytail': 'Extended agent lifecycle and command styling utilities',
      'pi-subagents': 'Parallel subagent delegation and task orchestration',
      'computer-use.ts': 'GUI and desktop screenshot automation and interaction',
      'danger-guard.ts': 'Safety guardrails and command interception system',
      'agent-router.ts': 'Dynamic routing between coding models and task planners',
      'memory.ts': 'Persistent semantic memory across chat sessions'
    };
    return knownMap[pkgName] || `Installed extension package (${pkgName})`;
  }
}
