import React from 'react';
import { Info, Terminal, Cpu, HardDrive, ExternalLink, ShieldCheck } from 'lucide-react';
import { PiInstallationInfo } from '../../types/pi';
import { PiLogo } from '../common/PiLogo';

interface AboutViewProps {
  info: PiInstallationInfo | null;
  username: string;
}

export const AboutView: React.FC<AboutViewProps> = ({ info, username }) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      <div className="p-5 border-b border-dark-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Info size={18} className="text-blue-400" />
          <span>About Pi Desktop</span>
        </h2>
        <p className="text-xs text-dark-400 mt-0.5">Control layer and desktop GUI for the Pi coding agent</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6 text-xs">
        {/* System & Agent status card */}
        <div className="p-5 rounded-2xl border border-dark-800 bg-dark-950/60 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-dark-800 pb-4">
            <PiLogo size={42} withBackground className="rounded-xl shadow-md" />
            <div>
              <h3 className="text-sm font-semibold text-white">Pi Coding Agent GUI</h3>
              <p className="text-dark-400">Desktop control manager, RPC bridge, and package coordinator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-dark-500 font-medium">Pi Version</span>
              <div className="font-mono text-white font-semibold">{info?.version || '0.85.1'}</div>
            </div>

            <div className="space-y-1">
              <span className="text-dark-500 font-medium">Installation Method</span>
              <div className="font-mono text-emerald-400">{info?.installationMethod || 'npm-global'}</div>
            </div>

            <div className="space-y-1">
              <span className="text-dark-500 font-medium">Active User</span>
              <div className="font-mono text-dark-200">{username}</div>
            </div>

            <div className="space-y-1">
              <span className="text-dark-500 font-medium">Platform</span>
              <div className="font-mono text-dark-200">Windows (x64)</div>
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-dark-800 font-mono text-[11px]">
            <span className="text-dark-500">Executable Path:</span>
            <div className="p-2 rounded bg-dark-900 border border-dark-750 text-dark-300 truncate">
              {info?.executablePath || 'Global PATH (pi)'}
            </div>
          </div>
        </div>

        {/* Security and architecture principles */}
        <div className="p-4 rounded-xl border border-dark-800 bg-dark-950/40 space-y-2 text-dark-300">
          <div className="flex items-center gap-2 font-semibold text-white text-xs">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Architecture & Principles</span>
          </div>
          <p className="leading-relaxed">
            Pi remains the sole source of truth for model interactions, tools, extensions, and sessions.
            The GUI communicates directly via structured JSON-RPC over stdin/stdout and intercepts interactive TUI requests into native dialog controls.
          </p>
        </div>
      </div>
    </div>
  );
};
