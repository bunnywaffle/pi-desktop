import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProviderAuthStatus } from '../../src/types/pi';

export class SettingsManager {
  public static getPiAgentDir(): string {
    return process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), '.pi', 'agent');
  }

  public static getGlobalSettingsPath(): string {
    return path.join(this.getPiAgentDir(), 'settings.json');
  }

  public static getProjectSettingsPath(projectDir: string): string {
    return path.join(projectDir, '.pi', 'settings.json');
  }

  public static getAuthPath(): string {
    return path.join(this.getPiAgentDir(), 'auth.json');
  }

  public static readSettings(scope: 'global' | 'project', projectDir?: string): Record<string, any> {
    const targetPath = scope === 'project' && projectDir
      ? this.getProjectSettingsPath(projectDir)
      : this.getGlobalSettingsPath();

    if (!fs.existsSync(targetPath)) {
      return {};
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  public static saveSettings(
    newSettings: Record<string, any>,
    scope: 'global' | 'project',
    projectDir?: string
  ): { success: boolean; error?: string } {
    const targetPath = scope === 'project' && projectDir
      ? this.getProjectSettingsPath(projectDir)
      : this.getGlobalSettingsPath();

    try {
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      // 1. Load current configuration to preserve unknown keys
      let existing: Record<string, any> = {};
      if (fs.existsSync(targetPath)) {
        try {
          existing = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        } catch {
          existing = {};
        }
      }

      // 2. Merge only requested changes
      const merged = { ...existing, ...newSettings };

      // 3. Validate JSON
      const jsonStr = JSON.stringify(merged, null, 2);

      // 4. Atomic write (write to .tmp then rename)
      const tmpPath = `${targetPath}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpPath, jsonStr, 'utf8');
      fs.renameSync(tmpPath, targetPath);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static getProviderAuthStatuses(): ProviderAuthStatus[] {
    const authPath = this.getAuthPath();
    let authJson: Record<string, any> = {};

    if (fs.existsSync(authPath)) {
      try {
        authJson = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      } catch {
        authJson = {};
      }
    }

    const providers = [
      { id: 'google', name: 'Google Gemini', env: 'GEMINI_API_KEY' },
      { id: 'anthropic', name: 'Anthropic Claude', env: 'ANTHROPIC_API_KEY' },
      { id: 'openai', name: 'OpenAI', env: 'OPENAI_API_KEY' },
      { id: 'openrouter', name: 'OpenRouter', env: 'OPENROUTER_API_KEY' },
      { id: 'deepseek', name: 'DeepSeek', env: 'DEEPSEEK_API_KEY' },
      { id: 'nvidia', name: 'NVIDIA NIM', env: 'NVIDIA_API_KEY' },
      { id: 'bansos', name: 'Bansos (Community Free)', env: 'BANSOS_API_KEY' },
      { id: 'groq', name: 'Groq', env: 'GROQ_API_KEY' },
      { id: 'mistral', name: 'Mistral AI', env: 'MISTRAL_API_KEY' },
      { id: 'xai', name: 'xAI (Grok)', env: 'XAI_API_KEY' },
      { id: 'together', name: 'Together AI', env: 'TOGETHER_API_KEY' },
      { id: 'cerebras', name: 'Cerebras', env: 'CEREBRAS_API_KEY' }
    ];

    return providers.map(p => {
      const inAuth = Boolean(authJson[p.id] && (authJson[p.id].key || authJson[p.id].tokens));
      const inEnv = Boolean(process.env[p.env]);

      let source: 'auth.json' | 'env' | 'none' = 'none';
      if (inAuth) source = 'auth.json';
      else if (inEnv) source = 'env';

      return {
        id: p.id,
        name: p.name,
        configured: inAuth || inEnv,
        source,
        type: 'api_key'
      };
    });
  }

  public static saveProviderKey(providerId: string, apiKey: string): { success: boolean; error?: string } {
    try {
      const authPath = this.getAuthPath();
      const parentDir = path.dirname(authPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      let authJson: Record<string, any> = {};
      if (fs.existsSync(authPath)) {
        try {
          authJson = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        } catch {
          authJson = {};
        }
      }

      if (apiKey.trim()) {
        authJson[providerId] = {
          type: 'api_key',
          key: apiKey.trim()
        };
      } else {
        delete authJson[providerId];
      }

      const tmpPath = `${authPath}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(authJson, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(tmpPath, authPath);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static getModelsJsonPath(scope: 'global' | 'project' = 'global', projectDir?: string): string {
    return scope === 'project' && projectDir
      ? path.join(projectDir, '.pi', 'models.json')
      : path.join(os.homedir(), '.pi', 'agent', 'models.json');
  }

  public static readModelsJson(scope: 'global' | 'project' = 'global', projectDir?: string): Record<string, any> {
    const targetPath = this.getModelsJsonPath(scope, projectDir);
    if (!fs.existsSync(targetPath)) return { providers: {} };
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return { providers: {} };
    }
  }

  public static saveCustomProvider(
    providerConfig: {
      id: string;
      name: string;
      baseUrl: string;
      api?: string;
      apiKey?: string;
      compat?: { supportsDeveloperRole?: boolean; supportsReasoningEffort?: boolean };
      models: Array<{ id: string; name?: string; reasoning?: boolean; contextWindow?: number; maxTokens?: number }>;
    },
    scope: 'global' | 'project' = 'global',
    projectDir?: string
  ): { success: boolean; error?: string } {
    try {
      const targetPath = this.getModelsJsonPath(scope, projectDir);
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const existing = this.readModelsJson(scope, projectDir);
      if (!existing.providers) existing.providers = {};

      existing.providers[providerConfig.id] = {
        name: providerConfig.name,
        baseUrl: providerConfig.baseUrl,
        api: providerConfig.api || 'openai-completions',
        apiKey: providerConfig.apiKey || providerConfig.id,
        compat: providerConfig.compat || { supportsDeveloperRole: false, supportsReasoningEffort: false },
        models: providerConfig.models || []
      };

      const tmpPath = `${targetPath}.tmp-${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2), 'utf8');
      fs.renameSync(tmpPath, targetPath);

      // Also register in auth.json so Pi recognizes authentication
      if (providerConfig.apiKey) {
        this.saveProviderKey(providerConfig.id, providerConfig.apiKey);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static deleteCustomProvider(
    providerId: string,
    scope: 'global' | 'project' = 'global',
    projectDir?: string
  ): { success: boolean; error?: string } {
    try {
      const targetPath = this.getModelsJsonPath(scope, projectDir);
      if (!fs.existsSync(targetPath)) return { success: true };

      const existing = this.readModelsJson(scope, projectDir);
      if (existing.providers && existing.providers[providerId]) {
        delete existing.providers[providerId];
        fs.writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf8');
      }

      // Also delete from auth.json
      this.saveProviderKey(providerId, '');

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  public static async getAvailableOnlineModels(): Promise<Array<{
    provider: string;
    id: string;
    contextWindow: string;
    maxTokens: string;
    thinking: boolean;
    vision: boolean;
  }>> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout } = await execAsync('pi --list-models', { maxBuffer: 10 * 1024 * 1024 });
      const lines = stdout.split('\n');
      const results: Array<{
        provider: string;
        id: string;
        contextWindow: string;
        maxTokens: string;
        thinking: boolean;
        vision: boolean;
      }> = [];

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('Provider') || line.startsWith('---') || line.includes('Context') || line.includes('Thinking')) {
          continue;
        }

        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const provider = parts[0];
          const id = parts[1];
          const contextWindow = parts[2] || '-';
          const maxTokens = parts[3] || '-';
          const thinking = parts[4]?.toLowerCase() === 'yes';
          const vision = parts[5]?.toLowerCase() === 'yes';

          results.push({
            provider,
            id,
            contextWindow,
            maxTokens,
            thinking,
            vision
          });
        }
      }

      return results;
    } catch (err) {
      console.error('Error fetching online models from pi:', err);
      // Return curated fallback list if pi CLI is momentarily busy
      return [
        { provider: 'anthropic', id: 'claude-3-7-sonnet-latest', contextWindow: '200K', maxTokens: '64K', thinking: true, vision: true },
        { provider: 'openai', id: 'gpt-4o', contextWindow: '128K', maxTokens: '16K', thinking: false, vision: true },
        { provider: 'openai', id: 'o3-mini', contextWindow: '200K', maxTokens: '100K', thinking: true, vision: false },
        { provider: 'google', id: 'gemini-2.5-flash', contextWindow: '1M', maxTokens: '64K', thinking: true, vision: true },
        { provider: 'deepseek', id: 'deepseek-r1', contextWindow: '64K', maxTokens: '8K', thinking: true, vision: false },
        { provider: 'openrouter', id: 'anthropic/claude-3.7-sonnet', contextWindow: '200K', maxTokens: '64K', thinking: true, vision: true },
        { provider: 'openrouter', id: 'meta-llama/llama-3.3-70b-instruct', contextWindow: '128K', maxTokens: '4K', thinking: false, vision: false }
      ];
    }
  }

  public static getExtensionOptions(extensionName: string): Record<string, any> {
    const settings = this.readSettings('global');
    return (settings.extensions && settings.extensions[extensionName]) || {};
  }

  public static saveExtensionOptions(extensionName: string, options: Record<string, any>): { success: boolean; error?: string } {
    const settings = this.readSettings('global');
    if (!settings.extensions) settings.extensions = {};
    settings.extensions[extensionName] = options;
    return this.saveSettings(settings, 'global');
  }
}

