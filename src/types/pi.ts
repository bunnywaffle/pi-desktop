export interface PiInstallationInfo {
  isInstalled: boolean;
  version?: string;
  executablePath?: string;
  installationMethod?: 'npm-global' | 'installer-script' | 'local' | 'unknown';
  works: boolean;
  output?: string;
  packageManagers: {
    npm: boolean;
    pnpm: boolean;
    yarn: boolean;
    bun: boolean;
    brew: boolean;
  };
}

export interface PiModel {
  id: string;
  name?: string;
  provider?: string;
  contextWindow?: number;
  maxTokens?: number;
  supportsThinking?: boolean;
  thinkingLevels?: string[];
}

export interface PiSessionState {
  model?: PiModel | any;
  thinkingLevel: string;
  isStreaming: boolean;
  isCompacting: boolean;
  steeringMode: string;
  followUpMode: string;
  sessionFile?: string;
  sessionId?: string;
  sessionName?: string;
  autoCompactionEnabled?: boolean;
  messageCount?: number;
  pendingMessageCount?: number;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface ThinkingContent {
  type: 'thinking';
  thinking: string;
}

export interface ToolCall {
  type: 'toolCall';
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface PiMessage {
  id?: string;
  role: 'user' | 'assistant' | 'toolResult' | 'custom' | 'system';
  content: string | (TextContent | ImageContent | ThinkingContent | ToolCall)[];
  timestamp?: number;
  api?: string;
  provider?: string;
  model?: string;
  stopReason?: string;
  errorMessage?: string;
  toolCallId?: string;
  toolName?: string;
  isError?: boolean;
  details?: any;
}

export interface ExtensionUiRequest {
  type: 'extension_ui_request';
  id: string;
  method: 'select' | 'confirm' | 'input' | 'editor' | 'notify' | 'setStatus' | 'setWidget' | 'setTitle' | 'set_editor_text';
  title?: string;
  message?: string;
  options?: string[];
  placeholder?: string;
  prefill?: string;
  timeout?: number;
  notifyType?: 'info' | 'warning' | 'error';
  statusKey?: string;
  statusText?: string;
  widgetKey?: string;
  widgetLines?: string[];
  widgetPlacement?: 'aboveEditor' | 'belowEditor';
  text?: string;
}

export interface ExtensionUiResponse {
  type: 'extension_ui_response';
  id: string;
  value?: string;
  confirmed?: boolean;
  cancelled?: boolean;
}

export interface PiPackage {
  name: string;
  source: string;
  version?: string;
  description?: string;
  scope: 'global' | 'project';
  extensions?: string[];
  skills?: string[];
  prompts?: string[];
  themes?: string[];
  enabled?: boolean;
}

export interface PiSkill {
  name: string;
  description: string;
  source: 'global' | 'project' | 'package' | 'custom';
  path: string;
  packageName?: string;
  enabled: boolean;
  content?: string;
  frontmatter?: Record<string, any>;
}

export interface PiExtension {
  name: string;
  source: string;
  path?: string;
  status: 'enabled' | 'disabled';
  location: 'global' | 'project' | 'package';
  description?: string;
}

export interface PiPromptTemplate {
  name: string;
  description?: string;
  path: string;
  scope: 'global' | 'project' | 'package';
  content: string;
}

export interface PiTheme {
  name: string;
  path?: string;
  isCustom: boolean;
  isCurrent: boolean;
  colors?: Record<string, string>;
}

export interface PiProject {
  name: string;
  path: string;
  branch?: string;
  isGit: boolean;
  trusted?: boolean;
  sessions: PiSessionSummary[];
}

export interface PiSessionSummary {
  id: string;
  path: string;
  name?: string;
  timestamp: number;
  lastMessage?: string;
  model?: string;
  thinkingLevel?: string;
  messageCount: number;
  cwd?: string;
}

export interface PiStats {
  sessionFile?: string;
  sessionId?: string;
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  totalMessages: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  cost: number;
  contextUsage?: {
    tokens: number;
    contextWindow: number;
    percent: number;
  };
}

export interface ProviderAuthStatus {
  id: string;
  name: string;
  configured: boolean;
  source: 'auth.json' | 'env' | 'none';
  type: 'api_key' | 'oauth';
  models?: string[];
}

export interface OnlineModelItem {
  provider: string;
  id: string;
  contextWindow: string;
  maxTokens: string;
  thinking: boolean;
  vision: boolean;
  name?: string;
  description?: string;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  api?: string;
  apiKey?: string;
  compat?: {
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
  };
  models: Array<{
    id: string;
    name?: string;
    reasoning?: boolean;
    contextWindow?: number;
    maxTokens?: number;
  }>;
}

