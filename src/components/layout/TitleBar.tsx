import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  PanelLeftClose,
  Minus,
  Square,
  X,
  ChevronDown,
  Plus
} from 'lucide-react';

interface TitleBarProps {
  appName?: string;
  version?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenTerminal: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  appName = 'Pi',
  version = '0.85.1',
  isSidebarOpen,
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
  onOpenTerminal
}) => {
  const handleMinimize = () => (window as any).electronAPI?.minimizeWindow();
  const handleMaximize = () => (window as any).electronAPI?.maximizeWindow();
  const handleClose = () => (window as any).electronAPI?.closeWindow();

  return (
    <div
      className="h-10 bg-dark-900 border-b border-dark-800 flex items-center justify-between px-3 text-xs text-dark-400 select-none z-50"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left controls */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center text-dark-500 gap-1">
          <button className="p-1 hover:text-dark-200 hover:bg-dark-800 rounded transition" title="Back">
            <ChevronLeft size={14} />
          </button>
          <button className="p-1 hover:text-dark-200 hover:bg-dark-800 rounded transition opacity-40 cursor-not-allowed" title="Forward">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Menu bar */}
        <div className="flex items-center gap-3 text-dark-300 font-medium">
          <span className="cursor-pointer hover:text-white transition" onClick={onNewChat}>File</span>
          <span className="cursor-pointer hover:text-white transition" onClick={onOpenSettings}>Edit</span>
          <span className="cursor-pointer hover:text-white transition" onClick={onToggleSidebar}>View</span>
          <span className="cursor-pointer hover:text-white transition" onClick={onOpenTerminal}>Terminal</span>
        </div>

        {/* App dropdown */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-dark-800/80 text-dark-200 font-semibold cursor-pointer hover:bg-dark-800 transition">
          <span>{appName}</span>
          <span className="text-[10px] text-pi-accent font-mono font-normal">v{version}</span>
          <ChevronDown size={11} className="text-dark-400" />
        </div>
      </div>

      {/* Center Spacer */}
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-dark-700 bg-dark-800/80 hover:bg-dark-800 text-dark-200 text-xs font-medium transition"
        >
          <Plus size={13} className="text-pi-accent" />
          <span>New Session</span>
        </button>

        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:text-dark-200 hover:bg-dark-800 rounded transition text-dark-400"
          title="Toggle Sidebar"
        >
          <PanelLeftClose size={14} className={isSidebarOpen ? '' : 'rotate-180'} />
        </button>

        {/* Window state buttons */}
        <div className="flex items-center ml-2 text-dark-400">
          <button onClick={handleMinimize} className="p-1.5 hover:bg-dark-800 hover:text-white rounded transition">
            <Minus size={13} />
          </button>
          <button onClick={handleMaximize} className="p-1.5 hover:bg-dark-800 hover:text-white rounded transition">
            <Square size={11} />
          </button>
          <button onClick={handleClose} className="p-1.5 hover:bg-red-600 hover:text-white rounded transition">
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
