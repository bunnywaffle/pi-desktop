import { contextBridge, ipcRenderer } from 'electron';
import { ExtensionUiResponse } from '../src/types/pi';

contextBridge.exposeInMainWorld('electronAPI', {
  // System Info
  getSystemUserInfo: () => ipcRenderer.invoke('system:user-info'),
  openExternalUrl: (url: string) => ipcRenderer.invoke('system:open-external', url),

  // Pi Detection & Setup
  detectPi: () => ipcRenderer.invoke('pi:detect'),
  installPi: (pm: string) => ipcRenderer.invoke('pi:install', pm),
  onInstallLog: (callback: (chunk: string) => void) => {
    const sub = (_: any, data: string) => callback(data);
    ipcRenderer.on('pi:install-log', sub);
    return () => ipcRenderer.removeListener('pi:install-log', sub);
  },

  // Pi RPC Session
  startSession: (options: any) => ipcRenderer.invoke('pi:start-session', options),
  stopSession: () => ipcRenderer.invoke('pi:stop-session'),
  isSessionAlive: () => ipcRenderer.invoke('pi:is-session-alive'),
  prompt: (msg: string, images?: any[], streamingBehavior?: 'steer' | 'followUp') =>
    ipcRenderer.invoke('pi:prompt', { msg, images, streamingBehavior }),
  steer: (msg: string, images?: any[]) => ipcRenderer.invoke('pi:steer', { msg, images }),
  followUp: (msg: string, images?: any[]) => ipcRenderer.invoke('pi:follow-up', { msg, images }),
  abort: () => ipcRenderer.invoke('pi:abort'),
  clearQueue: () => ipcRenderer.invoke('pi:clear-queue'),
  getState: () => ipcRenderer.invoke('pi:get-state'),
  getMessages: () => ipcRenderer.invoke('pi:get-messages'),
  getAvailableModels: () => ipcRenderer.invoke('pi:get-available-models'),
  setModel: (provider: string, modelId: string) => ipcRenderer.invoke('pi:set-model', { provider, modelId }),
  cycleModel: () => ipcRenderer.invoke('pi:cycle-model'),
  setThinkingLevel: (level: string) => ipcRenderer.invoke('pi:set-thinking-level', level),
  getAvailableThinkingLevels: () => ipcRenderer.invoke('pi:get-available-thinking-levels'),
  newSession: (parent?: string) => ipcRenderer.invoke('pi:new-session', parent),
  switchSession: (sessionPath: string) => ipcRenderer.invoke('pi:switch-session', sessionPath),
  fork: (entryId: string) => ipcRenderer.invoke('pi:fork', entryId),
  clone: () => ipcRenderer.invoke('pi:clone'),
  compact: (instructions?: string) => ipcRenderer.invoke('pi:compact', instructions),
  getSessionStats: () => ipcRenderer.invoke('pi:get-session-stats'),
  getCommands: () => ipcRenderer.invoke('pi:get-commands'),

  // UI Bridge Dialog Interception
  resolveUiDialog: (res: ExtensionUiResponse) => ipcRenderer.invoke('pi:resolve-ui-dialog', res),
  onUiDialogRequest: (callback: (req: any) => void) => {
    const sub = (_: any, data: any) => callback(data);
    ipcRenderer.on('pi:ui-dialog-request', sub);
    return () => ipcRenderer.removeListener('pi:ui-dialog-request', sub);
  },
  onUiFireAndForget: (callback: (req: any) => void) => {
    const sub = (_: any, data: any) => callback(data);
    ipcRenderer.on('pi:ui-fire-and-forget', sub);
    return () => ipcRenderer.removeListener('pi:ui-fire-and-forget', sub);
  },
  onUiDialogClosed: (callback: (data: { id: string }) => void) => {
    const sub = (_: any, data: any) => callback(data);
    ipcRenderer.on('pi:ui-dialog-closed', sub);
    return () => ipcRenderer.removeListener('pi:ui-dialog-closed', sub);
  },

  // Streamed RPC Events
  onPiEvent: (callback: (event: any) => void) => {
    const sub = (_: any, data: any) => callback(data);
    ipcRenderer.on('pi:event', sub);
    return () => ipcRenderer.removeListener('pi:event', sub);
  },
  onPiStderr: (callback: (text: string) => void) => {
    const sub = (_: any, data: string) => callback(data);
    ipcRenderer.on('pi:stderr', sub);
    return () => ipcRenderer.removeListener('pi:stderr', sub);
  },

  // Packages
  listPackages: (projectDir?: string) => ipcRenderer.invoke('packages:list', projectDir),
  installPackage: (source: string, isProjectScope: boolean, projectDir?: string) =>
    ipcRenderer.invoke('packages:install', { source, isProjectScope, projectDir }),
  removePackage: (source: string, isProjectScope: boolean, projectDir?: string) =>
    ipcRenderer.invoke('packages:remove', { source, isProjectScope, projectDir }),
  updatePackage: (source?: string) => ipcRenderer.invoke('packages:update', source),
  getPopularPackages: () => ipcRenderer.invoke('packages:popular'),

  // Skills
  listSkills: (projectDir?: string) => ipcRenderer.invoke('skills:list', projectDir),
  createSkill: (params: any) => ipcRenderer.invoke('skills:create', params),
  deleteSkill: (path: string) => ipcRenderer.invoke('skills:delete', path),

  // Prompts
  listPrompts: (projectDir?: string) => ipcRenderer.invoke('prompts:list', projectDir),
  savePrompt: (name: string, content: string, scope: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('prompts:save', { name, content, scope, projectDir }),
  deletePrompt: (path: string) => ipcRenderer.invoke('prompts:delete', path),

  // Themes
  listThemes: (currentTheme?: string) => ipcRenderer.invoke('themes:list', currentTheme),

  // Settings & Providers
  readSettings: (scope: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('settings:read', { scope, projectDir }),
  saveSettings: (settings: any, scope: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('settings:save', { settings, scope, projectDir }),
  getProviderAuthStatuses: () => ipcRenderer.invoke('settings:providers'),
  saveProviderKey: (providerId: string, apiKey: string) =>
    ipcRenderer.invoke('settings:save-key', { providerId, apiKey }),
  readModelsJson: (scope?: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('settings:read-models-json', { scope, projectDir }),
  saveCustomProvider: (providerConfig: any, scope?: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('settings:save-custom-provider', { providerConfig, scope, projectDir }),
  deleteCustomProvider: (providerId: string, scope?: 'global' | 'project', projectDir?: string) =>
    ipcRenderer.invoke('settings:delete-custom-provider', { providerId, scope, projectDir }),

  // Online Models Catalog
  listAllOnlineModels: () => ipcRenderer.invoke('models:list-all-online'),

  // Extension Options
  getExtensionOptions: (name: string) => ipcRenderer.invoke('extensions:get-options', name),
  saveExtensionOptions: (name: string, options: any) =>
    ipcRenderer.invoke('extensions:save-options', { name, options }),

  // Projects
  listProjects: () => ipcRenderer.invoke('projects:list'),
  inspectProject: (path: string) => ipcRenderer.invoke('projects:inspect', path),
  selectProjectFolder: () => ipcRenderer.invoke('projects:select-folder'),
  addRecentProject: (path: string) => ipcRenderer.invoke('projects:add-recent', path),
  removeRecentProject: (path: string) => ipcRenderer.invoke('projects:remove-recent', path),
  deleteProject: (path: string) => ipcRenderer.invoke('projects:delete', path),
  openInExplorer: (path: string) => ipcRenderer.invoke('projects:open-in-explorer', path),
  createProjectFolder: (parentDir: string, folderName: string) =>
    ipcRenderer.invoke('projects:create-folder', { parentDir, folderName }),

  // Sessions
  listSessionsForProject: (path: string) => ipcRenderer.invoke('sessions:project', path),
  listAllRecentSessions: () => ipcRenderer.invoke('sessions:recent'),
  deleteSession: (path: string) => ipcRenderer.invoke('sessions:delete', path),
  renameSession: (path: string, newName: string) => ipcRenderer.invoke('sessions:rename', { path, newName }),
  forkSession: (path: string) => ipcRenderer.invoke('sessions:fork', path),
  exportSession: (path: string, targetPath: string) => ipcRenderer.invoke('sessions:export', { path, targetPath }),
  readSessionMessages: (path: string) => ipcRenderer.invoke('sessions:read-messages', path),

  // Fallback Terminal
  startTerminal: (cwd: string) => ipcRenderer.invoke('terminal:start', cwd),
  writeTerminal: (data: string) => ipcRenderer.invoke('terminal:write', data),
  stopTerminal: () => ipcRenderer.invoke('terminal:stop'),
  onTerminalData: (callback: (data: string) => void) => {
    const sub = (_: any, data: string) => callback(data);
    ipcRenderer.on('terminal:data', sub);
    return () => ipcRenderer.removeListener('terminal:data', sub);
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close')
});
