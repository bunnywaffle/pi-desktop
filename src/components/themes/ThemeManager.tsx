import React, { useState, useEffect } from 'react';
import { Palette, Check, FolderOpen, RefreshCw, Sparkles, Sun, Moon, Info } from 'lucide-react';
import { BUILTIN_THEMES, ThemeDefinition, ThemeService } from '../../services/themeService';
import { PiTheme } from '../../types/pi';

export const ThemeManagerView: React.FC = () => {
  const [activeThemeId, setActiveThemeId] = useState<string>('dark');
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveThemeId(ThemeService.getActiveThemeId());
    loadCustomThemes();
  }, []);

  const loadCustomThemes = async () => {
    setIsLoading(true);
    try {
      if ((window as any).electronAPI?.listThemes) {
        const discovered: PiTheme[] = await (window as any).electronAPI.listThemes();
        if (Array.isArray(discovered)) {
          const mapped: ThemeDefinition[] = discovered
            .filter(t => t.isCustom && t.colors)
            .map(t => {
              const c = t.colors || {};
              return {
                id: t.name,
                name: t.name.charAt(0).toUpperCase() + t.name.slice(1),
                description: `Custom theme from ~/.pi/agent/themes/${t.name}.json`,
                type: (c.bg950 && c.bg950.startsWith('#f')) ? 'light' : 'dark',
                isCustom: true,
                colors: {
                  bg950: c.bg950 || c.background || '#09090b',
                  bg900: c.bg900 || c.surface || '#121214',
                  bg850: c.bg850 || '#18181b',
                  bg800: c.bg800 || c.selectedBg || '#202024',
                  border800: c.border800 || c.border || '#27272a',
                  border750: c.border750 || c.borderMuted || '#303036',
                  border700: c.border700 || '#3f3f46',
                  text100: c.text100 || '#ffffff',
                  text200: c.text200 || c.text || '#e4e4e7',
                  text300: c.text300 || '#a1a1aa',
                  text400: c.text400 || c.muted || '#71717a',
                  text500: c.text500 || c.dim || '#52525b',
                  accent: c.accent || c.primary || '#10a37f',
                  accentHover: c.accentHover || '#0d8a6a',
                  accentSubtle: c.accentSubtle || 'rgba(16, 163, 127, 0.15)'
                }
              };
            });
          setCustomThemes(mapped);
        }
      }
    } catch (err) {
      console.error('Error discovering custom themes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setActiveThemeId(theme.id);
    ThemeService.applyTheme(theme);
    setToastMessage(`Theme switched to "${theme.name}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenFolder = () => {
    if ((window as any).electronAPI?.openThemesFolder) {
      (window as any).electronAPI.openThemesFolder();
    }
  };

  const allThemes: ThemeDefinition[] = [...BUILTIN_THEMES, ...customThemes];

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden relative">
      {/* Header bar */}
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Palette size={18} className="text-pi-accent" />
            <span>Theme Manager</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">
            Select a color theme to instantly customize the desktop interface and sync with Pi CLI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomThemes}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-750 bg-dark-800 hover:bg-dark-700 text-xs text-dark-200 font-medium transition"
            title="Reload custom themes from disk"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-750 bg-dark-800 hover:bg-dark-700 text-xs text-dark-200 font-medium transition"
            title="Open ~/.pi/agent/themes in Explorer"
          >
            <FolderOpen size={13} />
            <span>Themes Folder</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Built-in Themes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-dark-400">
              Curated Themes ({BUILTIN_THEMES.length})
            </h3>
            <span className="text-[11px] text-dark-500 font-mono">Real-time live application</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {BUILTIN_THEMES.map((th) => {
              const isSelected = activeThemeId === th.id;
              return (
                <div
                  key={th.id}
                  onClick={() => handleSelectTheme(th)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between group shadow-sm ${
                    isSelected
                      ? 'border-pi-accent bg-dark-800/90 shadow-md ring-1 ring-pi-accent/40'
                      : 'border-dark-800 bg-dark-950/70 hover:border-dark-700 hover:bg-dark-900'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                        {th.type === 'light' ? (
                          <Sun size={13} className="text-amber-400" />
                        ) : (
                          <Moon size={13} className="text-dark-400" />
                        )}
                        <span className="truncate">{th.name}</span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-pi-accent text-dark-950 flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-dark-500 uppercase">{th.type}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-dark-400 leading-snug line-clamp-2">
                      {th.description}
                    </p>
                  </div>

                  {/* Swatches preview */}
                  <div className="mt-4 pt-3 border-t border-dark-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-dark-700 shadow-xs"
                        style={{ backgroundColor: th.colors.bg950 }}
                        title="Canvas Background"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-dark-700 shadow-xs"
                        style={{ backgroundColor: th.colors.bg900 }}
                        title="Surface Background"
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-dark-700 shadow-xs"
                        style={{ backgroundColor: th.colors.border800 }}
                        title="Borders"
                      />
                      <div
                        className="w-4 h-4 rounded-full shadow-xs"
                        style={{ backgroundColor: th.colors.accent }}
                        title="Accent Color"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-dark-500">
                      {isSelected ? 'ACTIVE' : 'APPLY'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Themes (if any) */}
        {customThemes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-dark-400">
                Discovered Custom Themes ({customThemes.length})
              </h3>
              <span className="text-[11px] text-dark-500 font-mono">~/.pi/agent/themes/*.json</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {customThemes.map((th) => {
                const isSelected = activeThemeId === th.id;
                return (
                  <div
                    key={th.id}
                    onClick={() => handleSelectTheme(th)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between group shadow-sm ${
                      isSelected
                        ? 'border-pi-accent bg-dark-800/90 shadow-md ring-1 ring-pi-accent/40'
                        : 'border-dark-800 bg-dark-950/70 hover:border-dark-700 hover:bg-dark-900'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                          <Sparkles size={13} className="text-pi-accent" />
                          <span className="truncate">{th.name}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-pi-accent text-dark-950 flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-dark-400 leading-snug line-clamp-2">
                        {th.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dark-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full border border-dark-700"
                          style={{ backgroundColor: th.colors.bg950 }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-dark-700"
                          style={{ backgroundColor: th.colors.bg900 }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: th.colors.accent }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-dark-500">CUSTOM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documentation / Custom Theme Guidance Card */}
        <div className="p-4 rounded-xl border border-dark-800 bg-dark-950/50 flex items-start gap-3 text-xs text-dark-300">
          <Info size={16} className="text-pi-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">Custom Pi Theme Support</div>
            <p className="leading-relaxed text-dark-400">
              Pi Desktop is fully compatible with standard Pi CLI theme files. Place any JSON theme file into <code className="text-pi-accent font-mono text-[11px]">~/.pi/agent/themes/my-theme.json</code> and it will automatically be loaded here. You can click <strong>Themes Folder</strong> above to access the directory directly.
            </p>
          </div>
        </div>

      </div>

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div className="absolute bottom-5 right-5 px-3.5 py-2 rounded-lg bg-dark-800 border border-pi-accent/50 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-fade-in">
          <Check size={14} className="text-pi-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
