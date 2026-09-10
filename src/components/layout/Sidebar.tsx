import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Sparkles,
  Settings,
  Folder,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FolderPlus,
  Circle,
  Boxes,
  ExternalLink,
  Trash2,
  Edit2,
  GitFork,
  Download,
  MoreVertical,
  History,
  X
} from 'lucide-react';
import { PiProject, PiSessionSummary } from '../../types/pi';
import { LoadExistingSessionModal } from '../chat/LoadExistingSessionModal';

export type NavTab = 'chat' | 'skills' | 'manager' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onNewChat: () => void;
  projects: PiProject[];
  currentProject: PiProject | null;
  onSelectProject: (proj: PiProject) => void;
  onOpenNewProjectFolder: () => void;
  onSelectSession: (session: PiSessionSummary) => void;
  onLoadExistingSession?: (session: PiSessionSummary & { projectDir?: string }) => void;
  onRefreshProjects: () => void;
  activeSessionId?: string;
  piVersion?: string;
}

interface ContextMenuState {
  type: 'project' | 'session';
  x: number;
  y: number;
  project?: PiProject;
  session?: PiSessionSummary;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onNewChat,
  projects,
  currentProject,
  onSelectProject,
  onOpenNewProjectFolder,
  onSelectSession,
  onLoadExistingSession,
  onRefreshProjects,
  activeSessionId,
  piVersion = '0.85.1'
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showLoadSessionModal, setShowLoadSessionModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameSessionModal, setRenameSessionModal] = useState<PiSessionSummary | null>(null);
  const [newSessionNameInput, setNewSessionNameInput] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleProject = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleProjectContextMenu = (e: React.MouseEvent, proj: PiProject) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'project',
      x: e.clientX,
      y: e.clientY,
      project: proj
    });
  };

  const handleSessionContextMenu = (e: React.MouseEvent, proj: PiProject, sess: PiSessionSummary) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'session',
      x: e.clientX,
      y: e.clientY,
      project: proj,
      session: sess
    });
  };

  const handleRemoveProject = async (proj: PiProject) => {
    setContextMenu(null);
    try {
      if ((window as any).electronAPI?.removeRecentProject) {
        await (window as any).electronAPI.removeRecentProject(proj.path);
        onRefreshProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (proj: PiProject) => {
    setContextMenu(null);
    if (!confirm(`Are you sure you want to remove project "${proj.name}" and delete its session history?`)) {
      return;
    }
    try {
      if ((window as any).electronAPI?.deleteProject) {
        await (window as any).electronAPI.deleteProject(proj.path);
        onRefreshProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenExplorer = (path: string) => {
    setContextMenu(null);
    (window as any).electronAPI?.openInExplorer?.(path);
  };

  const handleDeleteSession = async (sess: PiSessionSummary) => {
    setContextMenu(null);
    if (!confirm(`Delete session "${sess.name}"?`)) return;
    try {
      if ((window as any).electronAPI?.deleteSession) {
        await (window as any).electronAPI.deleteSession(sess.path);
        onRefreshProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForkSession = async (sess: PiSessionSummary) => {
    setContextMenu(null);
    try {
      if ((window as any).electronAPI?.forkSession) {
        const res = await (window as any).electronAPI.forkSession(sess.path);
        if (res.success) {
          onRefreshProjects();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportSession = async (sess: PiSessionSummary) => {
    setContextMenu(null);
    try {
      const targetHtml = sess.path.replace(/\.jsonl$/, '.html');
      if ((window as any).electronAPI?.exportSession) {
        const res = await (window as any).electronAPI.exportSession(sess.path, targetHtml);
        if (res.success) {
          alert(`Exported session to HTML at:\n${targetHtml}`);
        } else {
          alert(`Export failed: ${res.error}`);
        }
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleRenameSessionSubmit = async () => {
    if (!renameSessionModal || !newSessionNameInput.trim()) return;
    try {
      if ((window as any).electronAPI?.renameSession) {
        await (window as any).electronAPI.renameSession(renameSessionModal.path, newSessionNameInput.trim());
        setRenameSessionModal(null);
        setNewSessionNameInput('');
        onRefreshProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-64 bg-dark-950 border-r border-dark-800 flex flex-col h-full text-xs text-dark-300">
      {/* Top New Chat button */}
      <div className="p-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-750 text-dark-100 font-medium transition border border-dark-800 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-pi-accent" />
            <span>New session</span>
          </div>
          <span className="text-[10px] text-dark-500 font-mono">⌘N</span>
        </button>
      </div>

      {/* Main navigation tabs: ONLY Chat, Skills, Manager, Settings */}
      <div className="px-2 py-1 space-y-0.5 border-b border-dark-800 pb-2">
        <button
          onClick={() => onSelectTab('chat')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition ${currentTab === 'chat' ? 'bg-dark-800 text-white font-medium' : 'hover:bg-dark-900 hover:text-dark-200'}`}
        >
          <MessageSquare size={14} className={currentTab === 'chat' ? 'text-pi-accent' : 'text-dark-400'} />
          <span>Chat</span>
        </button>

        <button
          onClick={() => onSelectTab('skills')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition ${currentTab === 'skills' ? 'bg-dark-800 text-white font-medium' : 'hover:bg-dark-900 hover:text-dark-200'}`}
        >
          <Sparkles size={14} className={currentTab === 'skills' ? 'text-amber-400' : 'text-dark-400'} />
          <span>Skills</span>
        </button>

        <button
          onClick={() => onSelectTab('manager')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition ${currentTab === 'manager' ? 'bg-dark-800 text-white font-medium' : 'hover:bg-dark-900 hover:text-dark-200'}`}
        >
          <Boxes size={14} className={currentTab === 'manager' ? 'text-purple-400' : 'text-dark-400'} />
          <span>Manager</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition ${currentTab === 'settings' ? 'bg-dark-800 text-white font-medium' : 'hover:bg-dark-900 hover:text-dark-200'}`}
        >
          <Settings size={14} className={currentTab === 'settings' ? 'text-cyan-400' : 'text-dark-400'} />
          <span>Settings</span>
        </button>
      </div>

      {/* Projects & Sessions Section Header */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-semibold text-dark-500 uppercase tracking-wider">
          <span>Projects</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoadSessionModal(true)}
              className="text-dark-400 hover:text-purple-300 transition flex items-center gap-1 font-normal capitalize"
              title="Browse and load existing Pi sessions from ~/.pi/agent/sessions"
            >
              <History size={12} />
              <span>Resume</span>
            </button>
            <button
              onClick={onOpenNewProjectFolder}
              className="text-dark-400 hover:text-white transition flex items-center gap-1 font-normal capitalize"
              title="Open folder..."
            >
              <FolderPlus size={12} />
              <span>Open</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-1">
          {projects.map((proj) => {
            const isSelected = currentProject?.path === proj.path;
            const isExpanded = expandedProjects[proj.path] ?? true;

            return (
              <div key={proj.path} className="space-y-0.5">
                <div
                  onClick={() => {
                    onSelectProject(proj);
                    onSelectTab('chat');
                  }}
                  onContextMenu={(e) => handleProjectContextMenu(e, proj)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition group ${isSelected ? 'bg-dark-800/90 text-white font-medium' : 'hover:bg-dark-900 text-dark-300'}`}
                  title={`${proj.path} (Right-click for options)`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <button onClick={(e) => toggleProject(proj.path, e)} className="text-dark-400 hover:text-white">
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    <Folder size={13} className={isSelected ? 'text-pi-accent' : 'text-dark-500'} />
                    <span className="truncate font-medium">{proj.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pi-accent" />
                    )}
                    <button
                      onClick={(e) => handleProjectContextMenu(e, proj)}
                      className="opacity-0 group-hover:opacity-100 text-dark-400 hover:text-white p-0.5"
                    >
                      <MoreVertical size={12} />
                    </button>
                  </div>
                </div>

                {/* Real Sessions under project */}
                {isExpanded && proj.sessions && proj.sessions.length > 0 && (
                  <div className="pl-6 space-y-0.5">
                    {proj.sessions.map((sess) => {
                      const isCurrentSession = activeSessionId === sess.id;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            onSelectProject(proj);
                            onSelectSession(sess);
                            onSelectTab('chat');
                          }}
                          onContextMenu={(e) => handleSessionContextMenu(e, proj, sess)}
                          className={`px-2 py-1 rounded text-[11px] cursor-pointer truncate transition flex items-center justify-between group/sess ${isCurrentSession ? 'bg-dark-800 text-white font-medium' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-900/60'}`}
                          title={`${sess.name} (Right-click for options)`}
                        >
                          <span className="truncate">{sess.name}</span>
                          <div className="flex items-center gap-1">
                            {isCurrentSession && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                            <button
                              onClick={(e) => handleSessionContextMenu(e, proj, sess)}
                              className="opacity-0 group-hover/sess:opacity-100 text-dark-500 hover:text-white p-0.5"
                            >
                              <MoreVertical size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state: by default projects are empty */}
          {projects.length === 0 && (
            <div className="px-3 py-4 text-center border border-dashed border-dark-800 rounded-lg bg-dark-950/40 space-y-2">
              <Folder size={20} className="mx-auto text-dark-600" />
              <div className="text-xs text-dark-300 font-medium">No projects open</div>
              <p className="text-[11px] text-dark-500 leading-tight">
                Open a project folder or load a past session to start coding.
              </p>
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={onOpenNewProjectFolder}
                  className="w-full py-1.5 px-2 bg-dark-800 hover:bg-dark-750 text-white text-[11px] font-medium rounded border border-dark-700 transition flex items-center justify-center gap-1.5"
                >
                  <FolderPlus size={12} className="text-pi-accent" />
                  <span>Open Project Folder</span>
                </button>
                <button
                  onClick={() => setShowLoadSessionModal(true)}
                  className="w-full py-1.5 px-2 bg-dark-900 hover:bg-dark-850 text-dark-300 hover:text-purple-300 text-[11px] font-medium rounded border border-dark-800 transition flex items-center justify-center gap-1.5"
                >
                  <History size={12} className="text-purple-400" />
                  <span>Load Past Pi Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          className="fixed bg-dark-900 border border-dark-800 rounded-lg shadow-2xl py-1 z-50 min-w-[180px] text-xs text-dark-200 animate-in fade-in"
        >
          {contextMenu.type === 'project' && contextMenu.project && (
            <>
              <div className="px-3 py-1 text-[10px] font-mono text-dark-500 border-b border-dark-800 truncate">
                {contextMenu.project.name}
              </div>
              <button
                onClick={() => {
                  onSelectProject(contextMenu.project!);
                  onNewChat();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <Plus size={13} className="text-pi-accent" />
                <span>New Session Here</span>
              </button>
              <button
                onClick={() => handleOpenExplorer(contextMenu.project!.path)}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <ExternalLink size={13} className="text-blue-400" />
                <span>Open in File Explorer</span>
              </button>
              <button
                onClick={() => handleRemoveProject(contextMenu.project!)}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <X size={13} className="text-dark-400" />
                <span>Remove from Workspace</span>
              </button>
              <div className="border-t border-dark-800 my-1" />
              <button
                onClick={() => handleDeleteProject(contextMenu.project!)}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 flex items-center gap-2 transition"
              >
                <Trash2 size={13} />
                <span>Delete Project & History</span>
              </button>
            </>
          )}

          {contextMenu.type === 'session' && contextMenu.session && (
            <>
              <div className="px-3 py-1 text-[10px] font-mono text-dark-500 border-b border-dark-800 truncate">
                {contextMenu.session.name}
              </div>
              <button
                onClick={() => {
                  setRenameSessionModal(contextMenu.session!);
                  setNewSessionNameInput(contextMenu.session!.name || '');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <Edit2 size={13} className="text-amber-400" />
                <span>Rename Session</span>
              </button>
              <button
                onClick={() => handleForkSession(contextMenu.session!)}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <GitFork size={13} className="text-purple-400" />
                <span>Fork Session</span>
              </button>
              <button
                onClick={() => handleExportSession(contextMenu.session!)}
                className="w-full text-left px-3 py-1.5 hover:bg-dark-800 hover:text-white flex items-center gap-2 transition"
              >
                <Download size={13} className="text-emerald-400" />
                <span>Export to HTML</span>
              </button>
              <div className="border-t border-dark-800 my-1" />
              <button
                onClick={() => handleDeleteSession(contextMenu.session!)}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400 flex items-center gap-2 transition"
              >
                <Trash2 size={13} />
                <span>Delete Session</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Rename Session Modal */}
      {renameSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-sm w-full p-4 space-y-3 text-xs">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Edit2 size={14} className="text-amber-400" />
              <span>Rename Session</span>
            </h3>
            <input
              type="text"
              value={newSessionNameInput}
              onChange={(e) => setNewSessionNameInput(e.target.value)}
              placeholder="Session name..."
              className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-pi-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSessionSubmit();
                if (e.key === 'Escape') setRenameSessionModal(null);
              }}
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
              <button
                onClick={() => setRenameSessionModal(null)}
                className="px-3 py-1 border border-dark-700 rounded-lg text-dark-400 hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSessionSubmit}
                className="px-3 py-1 bg-pi-accent text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Existing Pi Session Modal */}
      {showLoadSessionModal && (
        <LoadExistingSessionModal
          onClose={() => setShowLoadSessionModal(false)}
          onSelectSession={(sess) => {
            setShowLoadSessionModal(false);
            if (onLoadExistingSession) {
              onLoadExistingSession(sess);
            }
          }}
        />
      )}
    </div>
  );
};
