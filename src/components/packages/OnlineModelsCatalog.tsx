import React, { useState, useEffect } from 'react';
import { Search, Download, Check, Sparkles, Eye, Brain, Server, RefreshCw, Cpu, ExternalLink } from 'lucide-react';
import { OnlineModelItem } from '../../types/pi';
import { getModelProviderInfo } from '../chat/BottomInputDock';

interface OnlineModelsCatalogProps {
  onSelectModel?: (modelId: string) => void;
  onRefresh?: () => void;
}

export const OnlineModelsCatalog: React.FC<OnlineModelsCatalogProps> = ({ onSelectModel, onRefresh }) => {
  const [models, setModels] = useState<OnlineModelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [thinkingOnly, setThinkingOnly] = useState(false);
  const [visionOnly, setVisionOnly] = useState(false);
  const [installedNotice, setInstalledNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchOnlineModels();
  }, []);

  const fetchOnlineModels = async () => {
    setLoading(true);
    try {
      if ((window as any).electronAPI?.listAllOnlineModels) {
        const list = await (window as any).electronAPI.listAllOnlineModels();
        setModels(list || []);
      }
    } catch (err) {
      console.error('Failed to load online models:', err);
    } finally {
      setLoading(false);
    }
  };

  const providers = ['all', ...Array.from(new Set(models.map(m => m.provider))).filter(Boolean)];

  const filteredModels = models.filter(m => {
    const matchesSearch =
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || m.provider === selectedProvider;
    const matchesThinking = !thinkingOnly || m.thinking;
    const matchesVision = !visionOnly || m.vision;
    return matchesSearch && matchesProvider && matchesThinking && matchesVision;
  });

  const handleEnableModel = async (model: OnlineModelItem) => {
    try {
      if (onSelectModel) {
        onSelectModel(model.id);
      }

      const settings = await (window as any).electronAPI.readSettings('global');
      await (window as any).electronAPI.saveSettings({
        ...settings,
        defaultProvider: model.provider,
        defaultModel: model.id
      }, 'global');

      setInstalledNotice(`Activated "${model.id}" in Pi!`);
      setTimeout(() => setInstalledNotice(null), 3000);

      onRefresh?.();
    } catch (err: any) {
      alert(`Error activating model: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-dark-800 bg-dark-950/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu size={16} className="text-purple-400" />
              <span>Online Models Catalog</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-800 text-dark-400 border border-dark-700">
                {filteredModels.length} models available
              </span>
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Browse, filter, and 1-click download/enable online models supported by Pi
            </p>
          </div>

          <button
            onClick={fetchOnlineModels}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-750 text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Catalog</span>
          </button>
        </div>

        {/* Search Input & Badges */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model name or provider (e.g. qwen, claude, llama, free)..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-dark-100 placeholder-dark-500 outline-none focus:border-purple-500 font-mono select-text cursor-text"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setThinkingOnly(!thinkingOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${thinkingOnly ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-dark-800/80 border-dark-750 text-dark-400 hover:text-dark-200'}`}
            >
              <Brain size={13} className={thinkingOnly ? 'text-amber-400' : ''} />
              <span>Reasoning Only</span>
            </button>

            <button
              onClick={() => setVisionOnly(!visionOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${visionOnly ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-dark-800/80 border-dark-750 text-dark-400 hover:text-dark-200'}`}
            >
              <Eye size={13} className={visionOnly ? 'text-blue-400' : ''} />
              <span>Vision Only</span>
            </button>
          </div>
        </div>

        {/* Provider Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {providers.slice(0, 14).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`px-2.5 py-1 rounded-md capitalize font-mono text-[11px] whitespace-nowrap transition ${selectedProvider === p ? 'bg-purple-600 text-white font-semibold' : 'bg-dark-900 border border-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-850'}`}
            >
              {p === 'all' ? 'All Providers' : p}
            </button>
          ))}
        </div>

        {installedNotice && (
          <div className="p-2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check size={14} />
            <span>{installedNotice}</span>
          </div>
        )}
      </div>

      {/* Models Grid / List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-dark-400 text-xs font-mono">
            Fetching models from Pi CLI...
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-dark-400 text-xs text-center">
            <p>No online models found matching &quot;{searchQuery}&quot;.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedProvider('all'); setThinkingOnly(false); setVisionOnly(false); }}
              className="mt-2 text-purple-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredModels.map((m) => {
              const info = getModelProviderInfo({ id: m.id, provider: m.provider });
              return (
                <div
                  key={`${m.provider}-${m.id}`}
                  className="bg-dark-950/70 border border-dark-800/90 rounded-xl p-3.5 flex flex-col justify-between hover:border-dark-700 transition shadow-sm group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${info.providerBadgeClass}`}>
                        {info.providerName}
                      </span>

                    <div className="flex items-center gap-1">
                      {m.thinking && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] flex items-center gap-1 font-mono" title="Supports Reasoning / Thinking">
                          <Brain size={10} />
                          <span>Thinking</span>
                        </span>
                      )}
                      {m.vision && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] flex items-center gap-1 font-mono" title="Supports Image / Vision input">
                          <Eye size={10} />
                          <span>Vision</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-xs font-semibold text-white truncate my-1" title={m.id}>
                    {m.id}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-dark-400 font-mono mt-2 mb-3 bg-dark-900/50 p-2 rounded border border-dark-800/60">
                    <div>
                      <span className="text-dark-500 block">Context:</span>
                      <span className="text-dark-200">{m.contextWindow || '128K'}</span>
                    </div>
                    <div>
                      <span className="text-dark-500 block">Max Output:</span>
                      <span className="text-dark-200">{m.maxTokens || '8K'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dark-800/70 flex items-center justify-between">
                  <span className="text-[10px] text-dark-500 font-mono">
                    {m.id.includes(':free') ? (
                      <span className="text-emerald-400 font-semibold">100% Free</span>
                    ) : (
                      <span>Online Ready</span>
                    )}
                  </span>

                  <button
                    onClick={() => handleEnableModel(m)}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-dark-800 group-hover:bg-purple-600 text-white font-medium text-xs transition border border-dark-700 group-hover:border-purple-500"
                    title="Download/Enable in Pi and set as active"
                  >
                    <Download size={12} />
                    <span>Download / Enable</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
