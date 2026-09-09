import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { PiDetector } from './pi/pi-detector';
import { PiInstaller } from './pi/pi-installer';
import { PiRpcProcess } from './pi/pi-rpc-process';
import { PiUiBridge } from './pi/pi-ui-bridge';
import { PackageManager } from './pi/package-manager';
import { SkillManager } from './pi/skill-manager';
import { PromptManager } from './pi/prompt-manager';
import { ThemeManager } from './pi/theme-manager';
import { SettingsManager } from './pi/settings-manager';
import { SessionManager } from './pi/session-manager';
import { ProjectManager } from './pi/project-manager';
import { TerminalService } from './terminal/terminal-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const piRpc = new PiRpcProcess();
let uiBridge: PiUiBridge;
const terminal = new TerminalService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#121214',
    show: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#121214',
      symbolColor: '#a1a1aa',
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  uiBridge = new PiUiBridge(() => mainWindow, piRpc);

  // Forward RPC events to renderer
  piRpc.on('event', (evt) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pi:event', evt);
    }
  });

  piRpc.on('stderr', (text) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pi:stderr', text);
    }
  });

  // Forward terminal data
  terminal.on('data', (text) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', text);
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  piRpc.stop();
  terminal.stop();
  if (process.platform !== 'darwin') app.quit();
});

function setupIpc() {
  // System info
  ipcMain.handle('system:user-info', () => {
    let username = 'User';
    try {
      username = os.userInfo().username || process.env.USERNAME || 'User';
    } catch {
      username = process.env.USERNAME || 'User';
    }
    return {
      username,
      platform: os.platform(),
      arch: os.arch(),
      version: app.getVersion()
    };
  });

  // Detection & Installer
  ipcMain.handle('pi:detect', async () => PiDetector.detect());
  ipcMain.handle('pi:install', async (_, pm: any) => {
    return PiInstaller.install({
      packageManager: pm,
      onLog: (chunk) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pi:install-log', chunk);
        }
      }
    });
  });

  ipcMain.handle('system:open-external', async (_, url: string) => {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // RPC Session
  ipcMain.handle('pi:start-session', async (_, options: any) => {
    try {
      if (!options.executablePath) {
        const detected = await PiDetector.detect();
        if (detected.executablePath) {
          options.executablePath = detected.executablePath;
        }
      }
      await piRpc.start(options);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  });
  ipcMain.handle('pi:stop-session', async () => {
    await piRpc.stop();
    return true;
  });
  ipcMain.handle('pi:is-session-alive', () => piRpc.alive);
  ipcMain.handle('pi:prompt', async (_, { msg, images, streamingBehavior }) => piRpc.prompt(msg, images, streamingBehavior));
  ipcMain.handle('pi:steer', async (_, { msg, images }) => piRpc.steer(msg, images));
  ipcMain.handle('pi:follow-up', async (_, { msg, images }) => piRpc.followUp(msg, images));
  ipcMain.handle('pi:abort', async () => piRpc.abort());
  ipcMain.handle('pi:clear-queue', async () => piRpc.clearQueue());
  ipcMain.handle('pi:get-state', async () => piRpc.getState());
  ipcMain.handle('pi:get-messages', async () => piRpc.getMessages());
  ipcMain.handle('pi:get-available-models', async () => piRpc.getAvailableModels());
  ipcMain.handle('pi:set-model', async (_, { provider, modelId }) => piRpc.setModel(provider, modelId));
  ipcMain.handle('pi:cycle-model', async () => piRpc.cycleModel());
  ipcMain.handle('pi:set-thinking-level', async (_, level) => piRpc.setThinkingLevel(level));
  ipcMain.handle('pi:get-available-thinking-levels', async () => piRpc.getAvailableThinkingLevels());
  ipcMain.handle('pi:new-session', async (_, parent) => piRpc.newSession(parent));
  ipcMain.handle('pi:switch-session', async (_, path) => piRpc.switchSession(path));
  ipcMain.handle('pi:fork', async (_, entryId) => piRpc.fork(entryId));
  ipcMain.handle('pi:clone', async () => piRpc.clone());
  ipcMain.handle('pi:compact', async (_, instructions) => piRpc.compact(instructions));
  ipcMain.handle('pi:get-session-stats', async () => piRpc.getSessionStats());
  ipcMain.handle('pi:get-commands', async () => piRpc.getCommands());

  // Dialog Bridge
  ipcMain.handle('pi:resolve-ui-dialog', async (_, response) => {
    uiBridge.resolveDialog(response.id, response);
    return true;
  });

  // Packages
  ipcMain.handle('packages:list', async (_, projectDir) => PackageManager.getInstalledPackages(projectDir));
  ipcMain.handle('packages:install', async (_, { source, isProjectScope, projectDir }) =>
    PackageManager.installPackage(source, isProjectScope, projectDir));
  ipcMain.handle('packages:remove', async (_, { source, isProjectScope, projectDir }) =>
    PackageManager.removePackage(source, isProjectScope, projectDir));
  ipcMain.handle('packages:update', async (_, source) => PackageManager.updatePackage(source));
  ipcMain.handle('packages:popular', () => PackageManager.getPopularPackages());

  // Skills
  ipcMain.handle('skills:list', async (_, projectDir) => SkillManager.discoverSkills(projectDir));
  ipcMain.handle('skills:create', async (_, params) => SkillManager.createSkill(params));
  ipcMain.handle('skills:delete', async (_, path) => SkillManager.deleteSkill(path));

  // Prompts
  ipcMain.handle('prompts:list', async (_, projectDir) => PromptManager.discoverPrompts(projectDir));
  ipcMain.handle('prompts:save', async (_, { name, content, scope, projectDir }) =>
    PromptManager.savePrompt(name, content, scope, projectDir));
  ipcMain.handle('prompts:delete', async (_, path) => PromptManager.deletePrompt(path));

  // Themes
  ipcMain.handle('themes:list', async (_, current) => ThemeManager.discoverThemes(current));

  // Settings
  ipcMain.handle('settings:read', async (_, { scope, projectDir }) => SettingsManager.readSettings(scope, projectDir));
  ipcMain.handle('settings:save', async (_, { settings, scope, projectDir }) =>
    SettingsManager.saveSettings(settings, scope, projectDir));
  ipcMain.handle('settings:providers', async () => SettingsManager.getProviderAuthStatuses());
  ipcMain.handle('settings:save-key', async (_, { providerId, apiKey }) =>
    SettingsManager.saveProviderKey(providerId, apiKey));
  ipcMain.handle('settings:read-models-json', async (_, { scope, projectDir }) =>
    SettingsManager.readModelsJson(scope, projectDir));
  ipcMain.handle('settings:save-custom-provider', async (_, { providerConfig, scope, projectDir }) =>
    SettingsManager.saveCustomProvider(providerConfig, scope, projectDir));
  ipcMain.handle('settings:delete-custom-provider', async (_, { providerId, scope, projectDir }) =>
    SettingsManager.deleteCustomProvider(providerId, scope, projectDir));

  // Online Models
  ipcMain.handle('models:list-all-online', async () => SettingsManager.getAvailableOnlineModels());

  // Extension Options
  ipcMain.handle('extensions:get-options', async (_, name) => SettingsManager.getExtensionOptions(name));
  ipcMain.handle('extensions:save-options', async (_, { name, options }) =>
    SettingsManager.saveExtensionOptions(name, options));

  // Projects
  ipcMain.handle('projects:list', async () => ProjectManager.getRecentProjects());
  ipcMain.handle('projects:inspect', async (_, path) => ProjectManager.inspectProject(path));
  ipcMain.handle('projects:select-folder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Directory for Pi'
    });
    if (!res.canceled && res.filePaths.length > 0) {
      await ProjectManager.addRecentProject(res.filePaths[0]);
      return res.filePaths[0];
    }
    return null;
  });
  ipcMain.handle('projects:add-recent', async (_, path) => ProjectManager.addRecentProject(path));
  ipcMain.handle('projects:remove-recent', async (_, path) => ProjectManager.removeRecentProject(path));
  ipcMain.handle('projects:delete', async (_, path) => ProjectManager.deleteProject(path));
  ipcMain.handle('projects:open-in-explorer', async (_, path) => ProjectManager.openInExplorer(path));
  ipcMain.handle('projects:create-folder', async (_, { parentDir, folderName }) =>
    ProjectManager.createProjectFolder(parentDir, folderName));

  // Sessions
  ipcMain.handle('sessions:project', async (_, path) => SessionManager.getSessionsForProject(path));
  ipcMain.handle('sessions:recent', async () => SessionManager.getAllRecentSessions());
  ipcMain.handle('sessions:delete', async (_, path) => SessionManager.deleteSession(path));
  ipcMain.handle('sessions:rename', async (_, { path, newName }) => SessionManager.renameSession(path, newName));
  ipcMain.handle('sessions:fork', async (_, path) => SessionManager.forkSession(path));
  ipcMain.handle('sessions:export', async (_, { path, targetPath }) => SessionManager.exportSession(path, targetPath));
  ipcMain.handle('sessions:read-messages', async (_, path) => SessionManager.readSessionMessages(path));

  // Terminal
  ipcMain.handle('terminal:start', async (_, cwd) => {
    terminal.start(cwd);
    return true;
  });
  ipcMain.handle('terminal:write', async (_, data) => {
    terminal.write(data);
    return true;
  });
  ipcMain.handle('terminal:stop', async () => {
    terminal.stop();
    return true;
  });

  // Window
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
}

