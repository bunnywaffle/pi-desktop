import React, { useState, useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { EmptyHeroState } from './components/chat/EmptyHeroState';
import { MessageList } from './components/chat/MessageList';
import { BottomInputDock, getModelProviderInfo } from './components/chat/BottomInputDock';
import { UiBridgeModal } from './components/ui-bridge/UiBridgeModal';
import { ToastContainer, ToastItem } from './components/ui-bridge/ToastContainer';
import { WidgetPanel } from './components/ui-bridge/WidgetPanel';
import { ManagerHub } from './components/manager/ManagerHub';
import { SkillManagerView } from './components/skills/SkillManager';
import { SettingsView } from './components/settings/SettingsView';
import { PiSetupView } from './components/setup/PiSetupView';
import {
  PiInstallationInfo,
  PiProject,
  PiSessionSummary,
  PiMessage,
  PiModel,
  PiStats,
  ToolCall,
  ExtensionUiRequest,
  ExtensionUiResponse
} from './types/pi';

interface SavedAppState {
  modelId?: string;
  provider?: string;
  thinkingLevel?: string;
  projectPath?: string;
  sessionPath?: string;
  sessionId?: string;
  sessionName?: string;
}

const STORAGE_KEY = 'pi_desktop_active_session_state';

function getSavedAppState(): SavedAppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAppState(partial: Partial<SavedAppState>) {
  try {
    const current = getSavedAppState() || {};
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save app state:', err);
  }
}

export const App: React.FC = () => {
  // Pi Installation & Session State
  const [piInfo, setPiInfo] = useState<PiInstallationInfo | null>(null);
  const [checkingInstall, setCheckingInstall] = useState(true);
  const [isSessionAlive, setIsSessionAlive] = useState(false);
  const [username, setUsername] = useState('Developer');

  // Layout & Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('chat');

  // Projects & Sessions
  const [projects, setProjects] = useState<PiProject[]>([]);
  const [currentProject, setCurrentProject] = useState<PiProject | null>(null);
  const [activeSession, setActiveSession] = useState<PiSessionSummary | null>(null);

  // Chat & Streaming State
  const [messages, setMessages] = useState<PiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingThinking, setStreamingThinking] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCall[]>([]);

  // Models & Runtime Stats
  const [models, setModels] = useState<PiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [thinkingLevel, setThinkingLevel] = useState<string>('medium');
  const [sessionStats, setSessionStats] = useState<PiStats | null>(null);
  const [statusText, setStatusText] = useState<string>('');

  // UI Bridge State
  const [uiDialogRequest, setUiDialogRequest] = useState<ExtensionUiRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [widgets, setWidgets] = useState<Record<string, string[]>>({});
  const [prefilledText, setPrefilledText] = useState<string>('');

  // Initial detection
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setCheckingInstall(true);
    try {
      if ((window as any).electronAPI?.getSystemUserInfo) {
        const u = await (window as any).electronAPI.getSystemUserInfo();
        if (u && u.username) setUsername(u.username);
      }

      const info = await (window as any).electronAPI.detectPi();
      setPiInfo(info);
      if (info && info.isInstalled) {
        await loadProjectsAndStart();
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setCheckingInstall(false);
    }
  };

  const loadProjectsAndStart = async () => {
    try {
      const saved = getSavedAppState();
      let homeDir = '';
      try {
        homeDir = await (window as any).electronAPI?.getHomeDir?.();
      } catch {}

      const projList: PiProject[] = await (window as any).electronAPI.listProjects();
      setProjects(projList || []);

      // Priority 1: Restore project the user was previously working in
      let activeProj: PiProject | null = null;
      if (saved?.projectPath) {
        const found = projList?.find(p => p.path.toLowerCase() === saved.projectPath!.toLowerCase());
        if (found) {
          activeProj = found;
        } else {
          try {
            const inspected = await (window as any).electronAPI.inspectProject(saved.projectPath);
            if (inspected) {
              activeProj = inspected;
              setProjects(prev => [inspected, ...prev.filter(p => p.path !== inspected.path)]);
            }
          } catch {
            // project folder may have moved or was deleted
          }
        }
      }

      if (!activeProj && projList && projList.length > 0) {
        activeProj = projList[0];
      }

      setCurrentProject(activeProj);
      const cwd = activeProj ? activeProj.path : (homeDir || '');

      await startPiSession(cwd, saved);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleOpenNewProjectFolder = async () => {
    try {
      const folderPath = await (window as any).electronAPI.selectProjectFolder();
      if (folderPath) {
        saveAppState({ projectPath: folderPath, sessionPath: undefined, sessionId: undefined, sessionName: undefined });
        const inspected: PiProject = await (window as any).electronAPI.inspectProject(folderPath);
        setProjects(prev => [inspected, ...prev.filter(p => p.path !== folderPath)]);
        setCurrentProject(inspected);
        await startPiSession(inspected.path, getSavedAppState());
        setCurrentTab('chat');
      }
    } catch (err) {
      console.error('Failed to open project folder:', err);
    }
  };

  const startPiSession = async (cwd: string, savedState?: SavedAppState | null) => {
    try {
      let homeDir = '';
      try {
        homeDir = await (window as any).electronAPI?.getHomeDir?.();
      } catch {}

      const safeCwd = (cwd && cwd !== '.' && cwd !== './') ? cwd : (homeDir || '');

      const settings = await (window as any).electronAPI.readSettings('global');
      const startOptions: any = {
        cwd: safeCwd,
        approveLocal: true
      };

      // Model & Thinking persistence priority: savedState > settings
      const preferredModel = savedState?.modelId || settings?.defaultModel;
      const preferredProvider = savedState?.provider || settings?.defaultProvider;
      const preferredThinking = savedState?.thinkingLevel || settings?.defaultThinkingLevel;

      if (preferredProvider) {
        startOptions.provider = preferredProvider;
      }
      if (preferredModel) {
        startOptions.model = preferredModel;
        setSelectedModel(preferredModel);
      }
      if (preferredThinking) {
        startOptions.thinkingLevel = preferredThinking;
        setThinkingLevel(preferredThinking);
      }

      const res = await (window as any).electronAPI.startSession(startOptions);
      if (res && res.success === false) {
        console.warn('Pi startSession warning:', res.error);
      }

      setIsSessionAlive(true);

      // Restore session if user had an active session saved
      let sessionRestored = false;
      if (savedState?.sessionPath) {
        try {
          if ((window as any).electronAPI?.readSessionMessages) {
            const loadedMsgs = await (window as any).electronAPI.readSessionMessages(savedState.sessionPath);
            if (Array.isArray(loadedMsgs) && loadedMsgs.length > 0) {
              setMessages(loadedMsgs);
              setActiveSession({
                id: savedState.sessionId || 'restored-session',
                path: savedState.sessionPath,
                name: savedState.sessionName,
                messageCount: loadedMsgs.length,
                timestamp: Date.now(),
                cwd: safeCwd
              });
              await (window as any).electronAPI.switchSession(savedState.sessionPath);
              sessionRestored = true;
            }
          }
        } catch (err) {
          console.warn('Could not restore previous session:', err);
        }
      }

      // Fetch live state from Pi!
      try {
        const state = await (window as any).electronAPI.getState();
        if (state) {
          if (preferredModel && state.model?.id !== preferredModel) {
            try {
              await (window as any).electronAPI.setModel(preferredProvider || '', preferredModel);
              setSelectedModel(preferredModel);
            } catch {}
          } else if (state.model && !preferredModel) {
            setSelectedModel(state.model.id || state.model.name || selectedModel);
          }

          if (preferredThinking && state.thinkingLevel !== preferredThinking) {
            try {
              await (window as any).electronAPI.setThinkingLevel(preferredThinking);
              setThinkingLevel(preferredThinking);
            } catch {}
          } else if (state.thinkingLevel && !preferredThinking) {
            setThinkingLevel(state.thinkingLevel);
          }

          if (!sessionRestored && state.sessionFile) {
            saveAppState({ sessionPath: state.sessionFile, sessionId: state.sessionId });
          }
        }
      } catch (err) {
        console.warn('Could not query immediate state:', err);
      }

      // Fetch models supported by Pi on this machine
      try {
        const modelsRes = await (window as any).electronAPI.getAvailableModels();
        let loadedModels: PiModel[] = modelsRes?.models || [];

        if ((window as any).electronAPI?.listAllOnlineModels) {
          const online = await (window as any).electronAPI.listAllOnlineModels();
          if (online && online.length > 0) {
            const existing = new Set(loadedModels.map(m => m.id.toLowerCase()));
            for (const o of online) {
              if (!existing.has(o.id.toLowerCase())) {
                loadedModels.push({
                  id: o.id,
                  name: o.name || o.id,
                  provider: o.provider,
                  supportsThinking: o.thinking
                });
                existing.add(o.id.toLowerCase());
              }
            }
          }
        }

        if (loadedModels.length > 0) {
          setModels(loadedModels);
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error starting Pi session:', err);
      setIsSessionAlive(false);
    }
  };

  // Setup Event Listeners
  useEffect(() => {
    const unsubEvent = (window as any).electronAPI?.onPiEvent?.((evt: any) => {
      handleIncomingPiEvent(evt);
    });

    const unsubUiDialog = (window as any).electronAPI?.onUiDialogRequest?.((req: ExtensionUiRequest) => {
      setUiDialogRequest(req);
    });

    const unsubUiFaf = (window as any).electronAPI?.onUiFireAndForget?.((req: ExtensionUiRequest) => {
      if (req.method === 'notify') {
        const id = `toast-${Date.now()}`;
        setToasts(prev => [...prev, { id, message: req.message || '', type: req.notifyType || 'info' }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
      } else if (req.method === 'setStatus') {
        setStatusText(req.statusText || '');
      } else if (req.method === 'setWidget' && req.widgetKey) {
        if (req.widgetLines) {
          setWidgets(prev => ({ ...prev, [req.widgetKey!]: req.widgetLines! }));
        } else {
          setWidgets(prev => {
            const copy = { ...prev };
            delete copy[req.widgetKey!];
            return copy;
          });
        }
      } else if (req.method === 'set_editor_text') {
        setPrefilledText(req.text || '');
      }
    });

    return () => {
      unsubEvent?.();
      unsubUiDialog?.();
      unsubUiFaf?.();
    };
  }, []);

  const handleIncomingPiEvent = (evt: any) => {
    switch (evt.type) {
      case 'agent_start':
        setIsStreaming(true);
        setStreamingText('');
        setStreamingThinking('');
        setStreamingToolCalls([]);
        break;

      case 'message_update':
        if (evt.assistantMessageEvent) {
          const e = evt.assistantMessageEvent;
          if (e.type === 'text_delta') {
            setStreamingText(prev => prev + e.delta);
          } else if (e.type === 'thinking_delta') {
            setStreamingThinking(prev => prev + e.delta);
          } else if (e.type === 'toolcall_start') {
            setStreamingToolCalls(prev => [
              ...prev,
              { id: e.id, name: e.toolName, arguments: {} } as ToolCall
            ]);
          } else if (e.type === 'toolcall_delta') {
            // Buffer args
          } else if (e.type === 'toolcall_end') {
            setStreamingToolCalls(prev =>
              prev.map(tc => tc.id === e.toolCall.id ? e.toolCall : tc)
            );
          }
        }
        break;

      case 'turn_end':
        if (evt.message) {
          setMessages(prev => [...prev, evt.message]);
        }
        setStreamingText('');
        setStreamingThinking('');
        setStreamingToolCalls([]);
        (window as any).electronAPI?.getState?.().then((state: any) => {
          if (state?.sessionFile) {
            saveAppState({
              sessionPath: state.sessionFile,
              sessionId: state.sessionId,
              modelId: state.model?.id || selectedModel
            });
            setActiveSession(prev => prev || {
              id: state.sessionId || 'active-session',
              path: state.sessionFile,
              messageCount: messages.length + 1,
              timestamp: Date.now(),
              cwd: currentProject?.path
            });
          }
        }).catch(() => {});
        break;

      case 'agent_end':
      case 'agent_settled':
        setIsStreaming(false);
        setStreamingText('');
        setStreamingThinking('');
        setStreamingToolCalls([]);
        (window as any).electronAPI?.getSessionStats?.().then((s: any) => {
          if (s) setSessionStats(s);
        }).catch(() => {});
        (window as any).electronAPI?.getState?.().then((state: any) => {
          if (state?.sessionFile) {
            saveAppState({
              sessionPath: state.sessionFile,
              sessionId: state.sessionId,
              modelId: state.model?.id || selectedModel
            });
            setActiveSession(prev => prev || {
              id: state.sessionId || 'active-session',
              path: state.sessionFile,
              messageCount: messages.length + 1,
              timestamp: Date.now(),
              cwd: currentProject?.path
            });
          }
        }).catch(() => {});
        break;
    }
  };

  const handleSendMessage = async (text: string, mode?: 'prompt' | 'steer' | 'followUp') => {
    if (mode === 'steer') {
      await (window as any).electronAPI.steer(text);
      return;
    }
    if (mode === 'followUp') {
      await (window as any).electronAPI.followUp(text);
      return;
    }

    const userMsg: PiMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      if (!isSessionAlive) {
        await startPiSession(currentProject?.path || '', getSavedAppState());
      }
      await (window as any).electronAPI.prompt(text);

      // Record active session information
      (window as any).electronAPI?.getState?.().then((state: any) => {
        if (state?.sessionFile) {
          saveAppState({
            sessionPath: state.sessionFile,
            sessionId: state.sessionId,
            modelId: state.model?.id || selectedModel
          });
        }
      }).catch(() => {});
    } catch (err: any) {
      setIsStreaming(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          errorMessage: err.message || 'Error executing prompt',
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleAbort = async () => {
    try {
      await (window as any).electronAPI.abort();
      setIsStreaming(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = async () => {
    try {
      await (window as any).electronAPI.newSession();
      setMessages([]);
      setActiveSession(null);
      saveAppState({ sessionPath: undefined, sessionId: undefined, sessionName: undefined });
      setCurrentTab('chat');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectModel = async (modelId: string) => {
    setSelectedModel(modelId);
    const found = models.find(m => m.id === modelId);
    const parts = modelId.split('/');
    const prov = found?.provider || (parts.length > 1 ? parts[0] : '');

    // Persist model selection across restarts
    saveAppState({ modelId, provider: prov });

    try {
      await (window as any).electronAPI.setModel(prov, modelId);
    } catch (err) {
      console.error('Failed to set model:', err);
    }
  };

  const handleSelectThinkingLevel = async (level: string) => {
    setThinkingLevel(level);
    saveAppState({ thinkingLevel: level });
    try {
      await (window as any).electronAPI.setThinkingLevel(level);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveUiDialog = (response: ExtensionUiResponse) => {
    (window as any).electronAPI.resolveUiDialog(response);
    setUiDialogRequest(null);
  };

  const handleLoadExistingSession = async (sess: PiSessionSummary & { projectDir?: string }) => {
    try {
      const sessionCwd = sess.cwd || sess.projectDir;
      saveAppState({
        sessionPath: sess.path,
        sessionId: sess.id,
        sessionName: sess.name,
        projectPath: sessionCwd,
        modelId: sess.model || selectedModel,
        thinkingLevel: sess.thinkingLevel || thinkingLevel
      });

      if (sessionCwd) {
        let existingProj = projects.find(p => p.path.toLowerCase() === sessionCwd.toLowerCase());
        if (!existingProj) {
          try {
            existingProj = await (window as any).electronAPI.inspectProject(sessionCwd);
            if (existingProj) {
              setProjects(prev => [existingProj!, ...prev]);
            }
          } catch {
            existingProj = {
              name: sessionCwd.split(/[\\/]/).filter(Boolean).pop() || 'Workspace',
              path: sessionCwd,
              isGit: false,
              sessions: [sess]
            };
            setProjects(prev => [existingProj!, ...prev]);
          }
        }
        if (existingProj) {
          setCurrentProject(existingProj);
        }
        await startPiSession(sessionCwd, getSavedAppState());
      }

      if ((window as any).electronAPI?.readSessionMessages) {
        const loadedMsgs = await (window as any).electronAPI.readSessionMessages(sess.path);
        if (Array.isArray(loadedMsgs) && loadedMsgs.length > 0) {
          setMessages(loadedMsgs);
        } else {
          setMessages([]);
        }
      }

      setActiveSession(sess);
      if (sess.model) setSelectedModel(sess.model);
      if (sess.thinkingLevel) setThinkingLevel(sess.thinkingLevel);

      try {
        await (window as any).electronAPI.switchSession(sess.path);
      } catch (err) {
        console.warn(err);
      }

      setCurrentTab('chat');
    } catch (err) {
      console.error('Failed to load existing session:', err);
    }
  };

  const handleEditPrompt = (text: string) => {
    setPrefilledText('');
    setTimeout(() => setPrefilledText(text), 10);
  };

  const handleRevertPrompt = async (messageIndex: number, text: string) => {
    if (isStreaming) {
      await handleAbort();
    }
    setMessages(prev => prev.slice(0, messageIndex));
    setPrefilledText('');
    setTimeout(() => setPrefilledText(text), 10);
  };

  if (checkingInstall) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-dark-950 text-dark-400 font-mono text-xs">
        Detecting Pi environment...
      </div>
    );
  }

  if (piInfo && !piInfo.isInstalled) {
    return (
      <div className="h-screen w-screen flex flex-col bg-dark-950">
        <TitleBar
          isSidebarOpen={false}
          onToggleSidebar={() => {}}
          onNewChat={() => {}}
          onOpenSettings={() => {}}
          onOpenTerminal={() => {}}
        />
        <PiSetupView info={piInfo} onScan={initApp} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-900 overflow-hidden font-sans">
      {/* Top Title Bar */}
      <TitleBar
        appName="Pi"
        version={piInfo?.version || '0.85.1'}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenTerminal={() => setCurrentTab('manager')}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onNewChat={handleNewChat}
            projects={projects}
            currentProject={currentProject}
            onSelectProject={(proj) => {
              setCurrentProject(proj);
              saveAppState({ projectPath: proj.path, sessionPath: undefined, sessionId: undefined, sessionName: undefined });
              startPiSession(proj.path, getSavedAppState());
            }}
            onOpenNewProjectFolder={handleOpenNewProjectFolder}
            onRefreshProjects={loadProjectsAndStart}
            onLoadExistingSession={handleLoadExistingSession}
            onSelectSession={async (sess) => {
              setActiveSession(sess);
              if (sess.model) setSelectedModel(sess.model);
              if (sess.thinkingLevel) setThinkingLevel(sess.thinkingLevel);
              saveAppState({
                sessionPath: sess.path,
                sessionId: sess.id,
                sessionName: sess.name,
                modelId: sess.model || selectedModel,
                thinkingLevel: sess.thinkingLevel || thinkingLevel
              });
              try {
                if ((window as any).electronAPI?.readSessionMessages) {
                  const msgs = await (window as any).electronAPI.readSessionMessages(sess.path);
                  if (Array.isArray(msgs)) setMessages(msgs);
                }
                await (window as any).electronAPI.switchSession(sess.path);
              } catch (err) {
                console.warn(err);
              }
            }}
            activeSessionId={activeSession?.id}
            piVersion={piInfo?.version}
          />
        )}

        {/* Dynamic Main View */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-dark-900 relative">
          {currentTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {messages.length === 0 && !isStreaming ? (
                <EmptyHeroState
                  projectName={currentProject?.name || 'Your Project'}
                  onSelectAction={(p) => handleSendMessage(p)}
                />
              ) : (
                <MessageList
                  messages={messages}
                  streamingText={streamingText}
                  streamingThinking={streamingThinking}
                  streamingToolCalls={streamingToolCalls}
                  isStreaming={isStreaming}
                  onEditPrompt={handleEditPrompt}
                  onRevertPrompt={handleRevertPrompt}
                />
              )}

              <WidgetPanel placement="aboveEditor" widgets={widgets} />

              <BottomInputDock
                projectName={currentProject?.name || 'Workspace'}
                branch={currentProject?.branch || 'master'}
                isStreaming={isStreaming}
                models={models}
                selectedModel={selectedModel}
                thinkingLevel={thinkingLevel}
                onSelectModel={handleSelectModel}
                onSelectThinkingLevel={handleSelectThinkingLevel}
                onSendMessage={handleSendMessage}
                onAbort={handleAbort}
                prefilledText={prefilledText}
              />
            </div>
          )}

          {currentTab === 'skills' && (
            <SkillManagerView
              projectDir={currentProject?.path}
              onRefreshPiState={() => startPiSession(currentProject?.path || process.cwd())}
            />
          )}

          {currentTab === 'manager' && (
            <ManagerHub
              projectDir={currentProject?.path}
              piInfo={piInfo}
              userName={username}
              onRefreshPiState={() => startPiSession(currentProject?.path || process.cwd())}
              onSelectModel={handleSelectModel}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              projectDir={currentProject?.path}
              onRefreshPiState={() => startPiSession(currentProject?.path || process.cwd())}
            />
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        isAlive={isSessionAlive}
        version={piInfo?.version}
        projectName={currentProject?.name}
        modelName={selectedModel}
        providerName={getModelProviderInfo({ id: selectedModel }).providerName}
        stats={sessionStats}
        statusText={statusText}
      />

      {/* TUI-to-GUI Bridge Native Modal */}
      <UiBridgeModal
        request={uiDialogRequest}
        onResolve={handleResolveUiDialog}
      />

      {/* Toasts Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  );
};
