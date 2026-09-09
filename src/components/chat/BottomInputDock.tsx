import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  Laptop,
  GitBranch,
  Plus,
  AlertCircle,
  ChevronDown,
  Mic,
  ArrowUp,
  Square,
  Sparkles
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
  const [hasFullAccess, setHasFullAccess] = useState(true);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [streamingQueueMode, setStreamingQueueMode] = useState<'steer' | 'followUp'>('steer');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fallbackModels: PiModel[] = [
    { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', supportsThinking: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', supportsThinking: false },
    { id: 'claude-3-7-sonnet-latest', supportsThinking: true },
    { id: 'gpt-4o', supportsThinking: false },
    { id: 'o3-mini', supportsThinking: true },
    { id: 'deepseek/deepseek-r1', supportsThinking: true }
  ];

  const effectiveModels = models && models.length > 0 ? models : fallbackModels;
  const filteredModels = effectiveModels.filter(m =>
    m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
  );

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

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div className="bg-dark-900 border border-dark-700/80 rounded-2xl shadow-2xl p-2.5 transition-all focus-within:border-dark-600 focus-within:ring-1 focus-within:ring-dark-600/50">
        {/* Top dock info pills */}
        <div className="flex items-center gap-2 mb-2 px-1 text-[11px] text-dark-400 font-medium">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800/80 text-dark-300">
            <Folder size={11} className="text-dark-400" />
            <span>{projectName}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800/80 text-dark-300">
            <Laptop size={11} className="text-dark-400" />
            <span>Local</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-dark-800/80 text-dark-300">
            <GitBranch size={11} className="text-dark-400" />
            <span>{branch}</span>
          </div>

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
          placeholder="Do anything"
          rows={2}
          className="w-full bg-transparent resize-none outline-none text-sm text-dark-100 placeholder-dark-500 px-2 py-1 leading-relaxed"
        />

        {/* Bottom controls bar */}
        <div className="flex items-center justify-between pt-1 px-1 text-xs">
          {/* Left tools: + and Access badge */}
          <div className="flex items-center gap-2">
            <button
              className="p-1 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-md transition"
              title="Add attachment or context"
            >
              <Plus size={16} />
            </button>

            <button
              onClick={() => setHasFullAccess(!hasFullAccess)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition ${hasFullAccess ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-500/50' : 'bg-dark-800 border-dark-700 text-dark-400'}`}
              title="Click to toggle Full Access / Read-Only approval"
            >
              <AlertCircle size={11} className={hasFullAccess ? 'text-amber-400' : 'text-dark-400'} />
              <span>{hasFullAccess ? 'Full access' : 'Read only'}</span>
            </button>
          </div>

          {/* Right controls: Model Picker, Voice, Send/Stop */}
          <div className="flex items-center gap-2 relative">
            {/* Model Selector dropdown with Live Search */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-800 hover:bg-dark-750 text-dark-300 hover:text-dark-100 transition text-[11px] font-medium border border-dark-700/60"
                title="Select model or search available models"
              >
                <Sparkles size={12} className="text-pi-accent" />
                <span className="truncate max-w-[140px] font-mono">
                  {selectedModel || 'Select Model'}
                </span>
                <ChevronDown size={12} className="text-dark-400" />
              </button>

              {showModelPicker && (
                <div className="absolute right-0 bottom-9 w-72 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl p-2 z-50 text-xs flex flex-col max-h-80 animate-in fade-in">
                  <div className="px-1 pb-1.5 flex items-center justify-between border-b border-dark-800 mb-1.5">
                    <span className="text-[10px] uppercase font-semibold text-dark-400 tracking-wider">
                      Select Model
                    </span>
                    <span className="text-[10px] font-mono text-dark-500">
                      {filteredModels.length} models
                    </span>
                  </div>

                  {/* Search bar inside model picker */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder="Search models (e.g. claude, gpt, nemotron)..."
                      className="w-full bg-dark-950 border border-dark-750 rounded-lg px-2.5 py-1 text-[11px] font-mono text-white placeholder-dark-500 outline-none focus:border-pi-accent"
                      autoFocus
                    />
                    {modelSearchQuery && (
                      <button
                        onClick={() => setModelSearchQuery('')}
                        className="absolute right-2 top-1.5 text-dark-500 hover:text-dark-300 text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Model Items */}
                  <div className="overflow-y-auto flex-1 space-y-0.5 max-h-56 pr-0.5">
                    {filteredModels.length > 0 ? (
                      filteredModels.map(m => {
                        const isSelected = selectedModel === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              onSelectModel(m.id);
                              setShowModelPicker(false);
                              setModelSearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-dark-800 transition flex items-center justify-between text-[11px] font-mono ${isSelected ? 'text-pi-accent font-semibold bg-dark-800/90' : 'text-dark-300'}`}
                          >
                            <span className="truncate pr-2">{m.id}</span>
                            {m.supportsThinking && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
                                thinking
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-dark-500 text-[11px] italic">
                        No models matching &quot;{modelSearchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mic voice icon */}
            <button className="p-1 text-dark-400 hover:text-dark-200 transition" title="Voice dictation">
              <Mic size={15} />
            </button>

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
