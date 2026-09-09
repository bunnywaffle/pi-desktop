import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, Square, RotateCcw, Copy } from 'lucide-react';

export const RawTerminalView: React.FC<{ cwd?: string }> = ({ cwd = process.cwd() }) => {
  const [output, setOutput] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).electronAPI.startTerminal(cwd);

    const unsubscribe = (window as any).electronAPI.onTerminalData((chunk: string) => {
      setOutput(prev => prev + chunk);
    });

    return () => {
      unsubscribe();
      (window as any).electronAPI.stopTerminal();
    };
  }, [cwd]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSend = () => {
    if (!input) return;
    (window as any).electronAPI.writeTerminal(input + '\r\n');
    setInput('');
  };

  const handleClear = () => {
    setOutput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-950 text-dark-200 overflow-hidden font-mono text-xs">
      <div className="p-3 bg-dark-900 border-b border-dark-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-dark-300">
          <TerminalIcon size={15} className="text-orange-400" />
          <span className="font-semibold text-white">Terminal / Raw Pi Fallback</span>
          <span className="text-dark-500">({cwd})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-750 text-dark-300 transition text-[11px]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 select-text leading-relaxed whitespace-pre-wrap text-dark-100"
      >
        {output || 'Initializing terminal...'}
      </div>

      {/* Command Input */}
      <div className="p-3 bg-dark-900 border-t border-dark-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Run pi command or shell command..."
          className="flex-1 bg-transparent outline-none text-white placeholder-dark-600 font-mono text-xs"
        />
        <button
          onClick={handleSend}
          className="px-3 py-1 rounded bg-pi-accent hover:bg-pi-hover text-white text-xs font-sans font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};
