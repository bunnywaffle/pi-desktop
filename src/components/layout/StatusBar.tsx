import React from 'react';
import { Cpu, HardDrive, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { PiStats } from '../../types/pi';

interface StatusBarProps {
  isAlive: boolean;
  version?: string;
  projectName?: string;
  modelName?: string;
  providerName?: string;
  stats?: PiStats | null;
  statusText?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isAlive,
  version = '0.85.1',
  projectName = 'Electron',
  modelName = 'nemotron-3-nano-omni-30b',
  providerName = 'bansos',
  stats,
  statusText
}) => {
  return (
    <div className="h-6 bg-dark-950 border-t border-dark-800/80 px-3 flex items-center justify-between text-[11px] text-dark-400 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isAlive ? 'bg-emerald-500 animate-pulse' : 'bg-dark-600'}`} />
          <span className="font-medium text-dark-300">{isAlive ? 'Pi Active' : 'Idle'}</span>
          <span className="text-[10px] text-dark-500">v{version}</span>
        </div>

        <div className="h-3 w-[1px] bg-dark-800" />

        <div className="flex items-center gap-1 text-dark-300">
          <HardDrive size={11} className="text-dark-500" />
          <span>{projectName}</span>
        </div>

        {statusText && (
          <>
            <div className="h-3 w-[1px] bg-dark-800" />
            <span className="text-blue-400 font-mono text-[10px]">{statusText}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 font-mono text-[10px]">
        {stats && (
          <>
            <span className="text-dark-400">
              Tokens: <span className="text-dark-200">{stats.tokens?.total?.toLocaleString() || 0}</span>
            </span>
            {stats.contextUsage && (
              <span className="text-dark-400">
                Context: <span className="text-dark-200">{stats.contextUsage.percent}%</span>
              </span>
            )}
            <div className="h-3 w-[1px] bg-dark-800" />
          </>
        )}

        <div className="flex items-center gap-1 text-dark-300">
          <Zap size={10} className="text-amber-400" />
          <span>{providerName}</span>
          <span className="text-dark-500">/</span>
          <span className="text-dark-200 truncate max-w-[140px]">{modelName}</span>
        </div>
      </div>
    </div>
  );
};
