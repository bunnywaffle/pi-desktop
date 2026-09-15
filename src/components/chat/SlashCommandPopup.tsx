import React, { useEffect, useRef } from 'react';
import {
  HelpCircle,
  Minimize2,
  Plus,
  Trash2,
  Sparkles,
  Brain,
  Activity,
  Download,
  Settings,
  Zap,
  FileCode,
  Package,
  Palette,
  Tag,
  GitFork,
  GitBranch,
  StopCircle,
  Terminal
} from 'lucide-react';
import { PiSlashCommand } from '../../types/pi';

interface SlashCommandPopupProps {
  commands: PiSlashCommand[];
  selectedIndex: number;
  onSelectCommand: (command: PiSlashCommand) => void;
  onClose: () => void;
}

function getCommandIcon(cmd: PiSlashCommand) {
  const name = cmd.name.toLowerCase();
  if (name === 'help') return <HelpCircle size={14} className="text-blue-400" />;
  if (name === 'compact') return <Minimize2 size={14} className="text-emerald-400" />;
  if (name === 'new') return <Plus size={14} className="text-emerald-400" />;
  if (name === 'clear') return <Trash2 size={14} className="text-red-400" />;
  if (name === 'model' || name === 'models') return <Sparkles size={14} className="text-amber-400" />;
  if (name === 'thinking') return <Brain size={14} className="text-purple-400" />;
  if (name === 'session' || name === 'stats') return <Activity size={14} className="text-cyan-400" />;
  if (name === 'export') return <Download size={14} className="text-indigo-400" />;
  if (name === 'settings') return <Settings size={14} className="text-dark-300" />;
  if (name === 'skills' || cmd.source === 'skill' || name.startsWith('skill:')) return <Zap size={14} className="text-amber-400" />;
  if (name === 'prompts' || cmd.source === 'prompt') return <FileCode size={14} className="text-teal-400" />;
  if (name === 'packages') return <Package size={14} className="text-orange-400" />;
  if (name === 'themes') return <Palette size={14} className="text-pink-400" />;
  if (name === 'name') return <Tag size={14} className="text-yellow-400" />;
  if (name === 'fork') return <GitFork size={14} className="text-indigo-400" />;
  if (name === 'clone' || name === 'tree') return <GitBranch size={14} className="text-emerald-400" />;
  if (name === 'abort') return <StopCircle size={14} className="text-red-400" />;

  return <Terminal size={14} className="text-dark-400" />;
}

function getSourceBadge(source: PiSlashCommand['source']) {
  switch (source) {
    case 'builtin':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-dark-950 text-dark-400 border border-dark-800">
          Built-in
        </span>
      );
    case 'skill':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Skill
        </span>
      );
    case 'extension':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">
          Extension
        </span>
      );
    case 'prompt':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
          Prompt
        </span>
      );
    default:
      return null;
  }
}

export const SlashCommandPopup: React.FC<SlashCommandPopupProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected index
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Click outside listener to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (commands.length === 0) {
    return (
      <div
        ref={containerRef}
        className="absolute left-0 bottom-full mb-2 w-full bg-dark-900 border border-dark-750 rounded-xl shadow-2xl p-3 z-50 text-center text-xs text-dark-400 animate-in fade-in"
      >
        No matching slash commands found.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-0 bottom-full mb-2 w-full bg-dark-900 border border-dark-750 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {/* Header bar */}
      <div className="px-3 py-1.5 bg-dark-950/80 border-b border-dark-800 flex items-center justify-between text-[10px] text-dark-400">
        <div className="flex items-center gap-1.5 font-medium text-dark-300">
          <Terminal size={12} className="text-pi-accent" />
          <span>Pi Slash Commands</span>
          <span className="text-dark-500">({commands.length})</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-dark-500">
          <span>↑↓ to navigate</span>
          <span>•</span>
          <span>Tab/Enter to select</span>
          <span>•</span>
          <span>Esc to dismiss</span>
        </div>
      </div>

      {/* Command list */}
      <div className="overflow-y-auto max-h-72 p-1 space-y-0.5">
        {commands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;

          return (
            <button
              key={`${cmd.source}-${cmd.name}`}
              ref={isSelected ? selectedItemRef : undefined}
              type="button"
              onClick={() => onSelectCommand(cmd)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between gap-3 text-xs ${
                isSelected
                  ? 'bg-dark-800 border-l-2 border-pi-accent text-white shadow-xs'
                  : 'hover:bg-dark-850 text-dark-300 hover:text-dark-100 border-l-2 border-transparent'
              }`}
            >
              {/* Left icon and command info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex-shrink-0">{getCommandIcon(cmd)}</div>
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="font-mono font-semibold text-white text-[13px]">
                    /{cmd.name}
                  </span>
                  {cmd.argumentHint && (
                    <span className="font-mono text-dark-500 text-[11px] truncate">
                      {cmd.argumentHint}
                    </span>
                  )}
                  <span className="text-dark-400 text-[11px] truncate ml-1 opacity-80">
                    — {cmd.description}
                  </span>
                </div>
              </div>

              {/* Right pill */}
              <div className="flex-shrink-0">
                {getSourceBadge(cmd.source)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
