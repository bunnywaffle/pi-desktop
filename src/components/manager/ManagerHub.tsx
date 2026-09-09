import React, { useState } from 'react';
import {
  Package,
  Layers,
  BookOpen,
  Palette,
  Terminal,
  Info,
  Cpu,
  Boxes
} from 'lucide-react';
import { PackageManagerView } from '../packages/PackageManager';
import { OnlineModelsCatalog } from '../packages/OnlineModelsCatalog';
import { ExtensionManagerView } from '../extensions/ExtensionManager';
import { PromptManagerView } from '../prompts/PromptManager';
import { ThemeManagerView } from '../themes/ThemeManager';
import { RawTerminalView } from '../terminal/RawTerminalView';
import { AboutView } from '../about/AboutView';
import { PiInstallationInfo } from '../../types/pi';

export type ManagerSubTab = 'packages' | 'online-models' | 'extensions' | 'prompts' | 'themes' | 'terminal' | 'about';

interface ManagerHubProps {
  projectDir?: string;
  piInfo: PiInstallationInfo | null;
  userName: string;
  onRefreshPiState: () => void;
  onSelectModel?: (modelId: string) => void;
  initialSubTab?: ManagerSubTab;
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  projectDir,
  piInfo,
  userName,
  onRefreshPiState,
  onSelectModel,
  initialSubTab = 'packages'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ManagerSubTab>(initialSubTab);

  const subTabs = [
    { id: 'packages', label: 'Packages', icon: Package, color: 'text-purple-400' },
    { id: 'online-models', label: 'Online Models', icon: Cpu, color: 'text-pink-400' },
    { id: 'extensions', label: 'Extensions', icon: Layers, color: 'text-blue-400' },
    { id: 'prompts', label: 'Prompts', icon: BookOpen, color: 'text-emerald-400' },
    { id: 'themes', label: 'Themes', icon: Palette, color: 'text-rose-400' },
    { id: 'terminal', label: 'Terminal / Raw Pi', icon: Terminal, color: 'text-orange-400' },
    { id: 'about', label: 'About Pi', icon: Info, color: 'text-cyan-400' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 overflow-hidden">
      {/* Top Manager Sub-Navbar */}
      <div className="px-5 py-2.5 bg-dark-950/80 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-dark-800 border border-dark-700 text-pi-accent">
            <Boxes size={16} />
          </div>
          <span className="font-semibold text-white text-xs tracking-wide uppercase">Pi Manager</span>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as ManagerSubTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${isActive ? 'bg-dark-800 text-white shadow-sm border border-dark-700' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-900'}`}
              >
                <Icon size={13} className={isActive ? tab.color : 'text-dark-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-View Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeSubTab === 'packages' && (
          <PackageManagerView
            projectDir={projectDir}
            onRefreshPiState={onRefreshPiState}
          />
        )}

        {activeSubTab === 'online-models' && (
          <OnlineModelsCatalog
            onSelectModel={onSelectModel}
            onRefresh={onRefreshPiState}
          />
        )}

        {activeSubTab === 'extensions' && (
          <ExtensionManagerView
            projectDir={projectDir}
            onRefreshPiState={onRefreshPiState}
          />
        )}

        {activeSubTab === 'prompts' && (
          <PromptManagerView
            projectDir={projectDir}
          />
        )}

        {activeSubTab === 'themes' && (
          <ThemeManagerView />
        )}

        {activeSubTab === 'terminal' && (
          <RawTerminalView
            cwd={projectDir || process.cwd()}
          />
        )}

        {activeSubTab === 'about' && (
          <AboutView
            info={piInfo}
            username={userName}
          />
        )}
      </div>
    </div>
  );
};
