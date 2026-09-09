import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Folder,
  GitBranch,
  ChevronDown,
  ArrowUp,
  Square,
  Sparkles,
  Brain,
  Search,
  Check
} from 'lucide-react';
import { PiModel } from '../../types/pi';

interface BottomInputDockProps {
  projectName: string;
  branch?: string;
  isStreaming: boolean;
  models: PiModel[];
  selectedModel: string;
  thinkingLevel: string;
  onSelectModel: (modelId: string) => void;
  onSelectThinkingLevel: (level: string) => void;
  onSendMessage: (message: string, mode?: 'prompt' | 'steer' | 'followUp') => void;
  onAbort: () => void;
  prefilledText?: string;
}

export interface ResolvedModelInfo {
  providerName: string;
  providerBadgeClass: string;
  displayTitle: string;
  isFree: boolean;
}

export function getModelProviderInfo(model: { id: string; name?: string; provider?: string }): ResolvedModelInfo {
  const rawProvider = (model.provider || '').toLowerCase().trim();
  const id = (model.id || '').toLowerCase().trim();
  const isFree = id.includes(':free') || rawProvider.includes('free');

  let providerName = '';
  let providerBadgeClass = 'bg-dark-800 text-dark-300 border-dark-700';

  if (rawProvider.includes('openrouter') || id.startsWith('openrouter/')) {
    providerName = 'OpenRouter';
    providerBadgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35';
  } else if (rawProvider.includes('anthropic') || id.startsWith('claude') || id.startsWith('anthropic/')) {
    providerName = 'Anthropic';
    providerBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/35';
  } else if (rawProvider.includes('openai') || id.startsWith('gpt') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('openai/')) {
    providerName = 'OpenAI';
    providerBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
  } else if (rawProvider.includes('google') || id.startsWith('gemini') || id.startsWith('google/')) {
    providerName = 'Google';
    providerBadgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/35';
  } else if (rawProvider.includes('groq') || id.startsWith('groq/')) {
    providerName = 'Groq';
    providerBadgeClass = 'bg-orange-500/20 text-orange-300 border-orange-500/35';
  } else if (rawProvider.includes('deepseek') || id.startsWith('deepseek/')) {
    providerName = 'DeepSeek';
    providerBadgeClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35';
  } else if (rawProvider.includes('ollama') || id.startsWith('ollama/')) {
    providerName = 'Ollama (Local)';
    providerBadgeClass = 'bg-pink-500/20 text-pink-300 border-pink-500/35';
  } else if (rawProvider.includes('cerebras') || id.startsWith('cerebras/')) {
    providerName = 'Cerebras';
    providerBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/35';
  } else if (rawProvider.includes('bansos')) {
    providerName = 'Bansos';
    providerBadgeClass = 'bg-teal-500/20 text-teal-300 border-teal-500/35';
  } else if (rawProvider) {
    providerName = model.provider ? (model.provider.charAt(0).toUpperCase() + model.provider.slice(1)) : 'Custom';
    providerBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/35';
  } else if (id.includes('/')) {
    const prefix = id.split('/')[0];
    providerName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    providerBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/35';
  } else {
    providerName = 'Default';
    providerBadgeClass = 'bg-dark-800 text-dark-400 border-dark-700';
  }

  const cleanDisplayTitle = model.name || (id.includes('/') ? id.split('/')[1] : id);

  return {
    providerName,
    providerBadgeClass,
    displayTitle: cleanDisplayTitle,
    isFree
  };
}

export const BottomInputDock: React.FC<BottomInputDockProps> = ({
  projectName,
  branch = 'master',
  isStreaming,
  models,
  selectedModel,
  thinkingLevel,
  onSelectModel,
  onSelectThinkingLevel,
  onSendMessage,
  onAbort,
  prefilledText = ''
}) => {
  const [text, setText] = useState(prefilledText);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showThinkingPicker, setShowThinkingPicker] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('all');
  const [streamingQueueMode, setStreamingQueueMode] = useState<'steer' | 'followUp'>('steer');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fallbackModels: PiModel[] = [
    { id: 'claude-3-7-sonnet-latest', name: 'Claude 3.7 Sonnet', provider: 'anthropic', supportsThinking: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', supportsThinking: false },
    { id: 'o3-mini', name: 'o3-mini', provider: 'openai', supportsThinking: true },
    { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', supportsThinking: true }
  ];

  const effectiveModels = models && models.length > 0 ? models : fallbackModels;

  const dynamicProviders = useMemo(() => {
    const provs = new Set<string>();
    for (const m of effectiveModels) {
      const info = getModelProviderInfo(m);
      if (info.providerName && info.providerName !== 'Default') {
        provs.add(info.providerName);
      }
    }
    return ['all', ...Array.from(provs).sort()];
  }, [effectiveModels]);

  // Filter models by query (matching id, name, and provider) and provider pill
  const filteredModels = effectiveModels.filter(m => {
    const info = getModelProviderInfo(m);
    const q = modelSearchQuery.toLowerCase().trim();

    const matchesProvider =
      selectedProviderFilter === 'all' ||
      info.providerName.toLowerCase().includes(selectedProviderFilter.toLowerCase());

    if (!matchesProvider) return false;
    if (!q) return true;

    return (
      m.id.toLowerCase().includes(q) ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      info.providerName.toLowerCase().includes(q) ||
      info.displayTitle.toLowerCase().includes(q) ||
      (q === 'free' && info.isFree) ||
      (q === 'thinking' && m.supportsThinking)
    );
  });

  // Close model picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
        setShowThinkingPicker(false);
      }
    };
    if (showModelPicker || showThinkingPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelPicker, showThinkingPicker]);

  useEffect(() => {
    if (prefilledText !== undefined && prefilledText !== null) {
      setText(prefilledText);
      if (prefilledText) {
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(prefilledText.length, prefilledText.length);
        }, 50);
      }
    }
  }, [prefilledText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isStreaming) {
      onSendMessage(trimmed, streamingQueueMode);
    } else {
      onSendMessage(trimmed, 'prompt');
    }
    setText('');
  };

  const currentModelInfo = getModelProviderInfo({ id: selectedModel });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div
        onClick={() => textareaRef.current?.focus()}
        className="bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl p-2.5 transition-all focus-within:border-dark-600 focus-within:ring-1 focus-within:ring-dark-600/50 cursor-text"
      >
        {/* Top dock info pills */}
        <div className="flex items-center gap-2 mb-2 px-1 text-[11px] text-dark-400 font-medium" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800/80 text-dark-300">
            <Folder size={11} className="text-dark-400" />
            <span>{projectName || 'Workspace'}</span>
          </div>

          {branch && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800/80 text-dark-300">
              <GitBranch size={11} className="text-dark-400" />
              <span>{branch}</span>
            </div>
          )}

          {isStreaming && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400 font-medium animate-pulse">
              <span>Streaming...</span>
            </div>
          )}
        </div>

        {/* Text input area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Pi or give instructions (Enter to send, Shift+Enter for new line)..."
          rows={2}
          className="w-full bg-transparent resize-none outline-none text-sm text-dark-100 placeholder-dark-500 px-2 py-1 leading-relaxed select-text cursor-text"
        />

        {/* Bottom controls bar */}
        <div className="flex items-center justify-between pt-1 px-1 text-xs" onClick={(e) => e.stopPropagation()}>
          {/* Left tools: Reasoning effort level selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowThinkingPicker(!showThinkingPicker);
                setShowModelPicker(false);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-dark-800/80 hover:bg-dark-800 border border-dark-750 text-dark-300 hover:text-white transition text-[11px] font-medium"
              title="Change reasoning thinking level"
            >
              <Brain size={12} className="text-purple-400" />
              <span className="capitalize">{thinkingLevel}</span>
              <ChevronDown size={11} className="text-dark-500" />
            </button>

            {showThinkingPicker && (
              <div
                ref={pickerRef}
                className="absolute left-0 bottom-9 w-40 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs flex flex-col space-y-0.5 animate-in fade-in"
              >
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-dark-500 border-b border-dark-800 mb-1">
                  Reasoning Effort
                </div>
                {(['off', 'minimal', 'low', 'medium', 'high'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      onSelectThinkingLevel(lvl);
                      setShowThinkingPicker(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg flex items-center justify-between capitalize text-[11px] transition ${thinkingLevel === lvl ? 'bg-purple-600/30 text-purple-200 font-medium' : 'hover:bg-dark-800 text-dark-300'}`}
                  >
                    <span>{lvl}</span>
                    {thinkingLevel === lvl && <Check size={11} className="text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right controls: Model Picker with Provider Badges & Send button */}
          <div className="flex items-center gap-2 relative">
            {/* Model Selector dropdown with Live Search & Provider Display */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowModelPicker(!showModelPicker);
                  setShowThinkingPicker(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-800 hover:bg-dark-750 text-dark-200 hover:text-white transition text-[11px] font-medium border border-dark-700/80 shadow-xs"
                title="Select model and view provider details"
              >
                <Sparkles size={12} className="text-pi-accent" />
                <span className={`px-1 py-0.2 rounded text-[9px] font-mono border ${currentModelInfo.providerBadgeClass || 'bg-dark-900 text-dark-400'}`}>
                  {currentModelInfo.providerName}
                </span>
                <span className="truncate max-w-[130px] font-mono">
                  {currentModelInfo.displayTitle || selectedModel || 'Select Model'}
                </span>
                <ChevronDown size={12} className="text-dark-400" />
              </button>

              {showModelPicker && (
                <div
                  ref={pickerRef}
                  className="absolute right-0 bottom-9 w-96 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl p-2.5 z-50 text-xs flex flex-col max-h-96 animate-in fade-in"
                >
                  <div className="px-1 pb-2 flex items-center justify-between border-b border-dark-800 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-white">Select Model</span>
                      <span className="text-[10px] text-dark-400 block">Providers clearly identified for each model</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-dark-400 border border-dark-750">
                      {filteredModels.length} models
                    </span>
                  </div>

                  {/* Search bar inside model picker */}
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-2.5 top-2 text-dark-500" />
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder="Search by model or provider (e.g. claude, ollama, free)..."
                      className="w-full bg-dark-950 border border-dark-750 rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-white placeholder-dark-500 outline-none focus:border-pi-accent select-text cursor-text font-mono"
                      autoFocus
                    />
                    {modelSearchQuery && (
                      <button
                        onClick={() => setModelSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-dark-500 hover:text-dark-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Provider filter pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1 text-[10px] no-scrollbar">
                    {dynamicProviders.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedProviderFilter(p === 'all' ? 'all' : p)}
                        className={`px-2 py-0.5 rounded font-medium whitespace-nowrap transition border ${selectedProviderFilter.toLowerCase() === p.toLowerCase() ? 'bg-pi-accent text-white border-pi-accent' : 'bg-dark-950 border-dark-800 text-dark-400 hover:text-white'}`}
                      >
                        {p === 'all' ? 'All' : p}
                      </button>
                    ))}
                  </div>

                  {/* Model Items */}
                  <div className="overflow-y-auto flex-1 space-y-1 max-h-60 pr-0.5">
                    {filteredModels.length > 0 ? (
                      filteredModels.map(m => {
                        const isSelected = selectedModel === m.id;
                        const info = getModelProviderInfo(m);

                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              onSelectModel(m.id);
                              setShowModelPicker(false);
                              setModelSearchQuery('');
                            }}
                            className={`w-full text-left p-2 rounded-lg border transition flex flex-col gap-0.5 ${isSelected ? 'bg-dark-800 border-pi-accent text-white shadow-xs' : 'bg-dark-950/60 border-dark-800/80 hover:bg-dark-800/80 hover:border-dark-700 text-dark-200'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white truncate text-xs">
                                {info.displayTitle}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border font-medium flex-shrink-0 ${info.providerBadgeClass}`}>
                                {info.providerName}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-dark-400 font-mono mt-0.5">
                              <span className="truncate max-w-[220px] text-dark-500">{m.id}</span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {info.isFree && (
                                  <span className="text-teal-400 font-medium text-[9px]">Free</span>
                                )}
                                {m.supportsThinking && (
                                  <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px]">
                                    thinking
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-dark-500 text-[11px] italic">
                        No models matching &quot;{modelSearchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit or Stop button */}
            {isStreaming ? (
              <button
                onClick={onAbort}
                className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-md"
                title="Stop generation (Abort)"
              >
                <Square size={11} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-md ${text.trim() ? 'bg-pi-accent hover:bg-pi-hover text-white' : 'bg-dark-800 text-dark-500 cursor-not-allowed'}`}
                title="Send message (Enter)"
              >
                <ArrowUp size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
