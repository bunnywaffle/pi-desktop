import React, { useState } from 'react';
import { Terminal, FileText, Edit3, Check, ChevronDown, ChevronRight, Copy, AlertTriangle } from 'lucide-react';
import { ToolCall } from '../../types/pi';

interface ToolCallItemProps {
  toolCall: ToolCall;
  result?: any;
  isStreaming?: boolean;
  isError?: boolean;
}

export const ToolCallItem: React.FC<ToolCallItemProps> = ({ toolCall, result, isStreaming, isError }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'bash':
      case 'powershell':
        return <Terminal size={12} className="text-amber-400" />;
      case 'read':
      case 'find':
      case 'grep':
      case 'ls':
        return <FileText size={12} className="text-blue-400" />;
      case 'write':
      case 'edit':
        return <Edit3 size={12} className="text-emerald-400" />;
      default:
        return <Terminal size={12} className="text-purple-400" />;
    }
  };

  const getSummary = () => {
    const args = toolCall.arguments || {};
    if (args.command) return `$ ${args.command}`;
    if (args.path) return args.path;
    if (args.filePath) return args.filePath;
    if (args.pattern) return `pattern: ${args.pattern}`;
    return JSON.stringify(args).slice(0, 50);
  };

  const getOutputText = () => {
    if (!result) return '';
    if (typeof result === 'string') return result;
    if (result.content && Array.isArray(result.content)) {
      return result.content.map((c: any) => c.text || '').join('\n');
    }
    return JSON.stringify(result, null, 2);
  };

  const outputText = getOutputText();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`my-2 rounded-lg border text-xs font-mono transition-all overflow-hidden ${isError ? 'border-red-500/40 bg-red-950/20' : 'border-dark-700/60 bg-dark-900/60'}`}>
      {/* Compact Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-dark-800/60 transition"
      >
        <div className="flex items-center gap-2 truncate flex-1 mr-2">
          {getToolIcon(toolCall.name)}
          <span className="font-semibold text-dark-300 capitalize">{toolCall.name}</span>
          <span className="text-dark-500 truncate max-w-md">{getSummary()}</span>
        </div>

        <div className="flex items-center gap-2 text-dark-400">
          {isStreaming ? (
            <span className="text-[10px] text-amber-400 animate-pulse">Running...</span>
          ) : isError ? (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <AlertTriangle size={11} /> Failed
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <Check size={11} /> Done
            </span>
          )}

          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </div>

      {/* Expanded Output */}
      {expanded && (
        <div className="border-t border-dark-800/80 bg-dark-950/80 p-3 text-[11px] relative">
          <div className="flex justify-between items-center text-dark-500 mb-1 font-sans">
            <span>Execution Output</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-dark-200 transition"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-dark-300 whitespace-pre-wrap max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed select-text">
            {outputText || '(No output)'}
          </pre>
        </div>
      )}
    </div>
  );
};
