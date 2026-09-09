import React, { useState } from 'react';
import { PiMessage, ToolCall } from '../../types/pi';
import { ToolCallItem } from './ToolCallItem';
import { Copy, Check, ChevronDown, ChevronRight, Brain, User, Bot, AlertCircle, Edit3, RotateCcw } from 'lucide-react';

interface MessageListProps {
  messages: PiMessage[];
  streamingText?: string;
  streamingThinking?: string;
  streamingToolCalls?: ToolCall[];
  isStreaming?: boolean;
  onEditPrompt?: (text: string) => void;
  onRevertPrompt?: (messageIndex: number, text: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingText = '',
  streamingThinking = '',
  streamingToolCalls = [],
  isStreaming = false,
  onEditPrompt,
  onRevertPrompt
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto space-y-6">
      {messages.map((msg, index) => (
        <MessageItem
          key={index}
          index={index}
          message={msg}
          onEditPrompt={onEditPrompt}
          onRevertPrompt={onRevertPrompt}
        />
      ))}

      {/* Live Streaming Turn */}
      {isStreaming && (
        <div className="space-y-3">
          {streamingThinking && (
            <ThinkingBlock thinking={streamingThinking} isStreaming={true} />
          )}

          {streamingToolCalls.map((tc, idx) => (
            <ToolCallItem key={idx} toolCall={tc} isStreaming={true} />
          ))}

          {streamingText && (
            <div className="flex gap-3 text-sm">
              <div className="w-7 h-7 rounded-lg bg-pi-accent/20 border border-pi-accent/40 flex items-center justify-center text-pi-accent flex-shrink-0 mt-0.5">
                <Bot size={15} />
              </div>
              <div className="flex-1 text-dark-100 leading-relaxed font-sans prose-dark whitespace-pre-wrap select-text">
                {streamingText}
                <span className="inline-block w-1.5 h-4 bg-pi-accent ml-1 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MessageItem: React.FC<{
  message: PiMessage;
  index: number;
  onEditPrompt?: (text: string) => void;
  onRevertPrompt?: (messageIndex: number, text: string) => void;
}> = ({ message, index, onEditPrompt, onRevertPrompt }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const getRawText = (): string => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
    }
    return '';
  };

  const getThinking = (): string => {
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c: any) => c.type === 'thinking')
        .map((c: any) => c.thinking)
        .join('\n');
    }
    return '';
  };

  const getToolCalls = (): ToolCall[] => {
    if (Array.isArray(message.content)) {
      return message.content.filter((c: any) => c.type === 'toolCall') as ToolCall[];
    }
    return [];
  };

  const text = getRawText();
  const thinking = getThinking();
  const toolCalls = getToolCalls();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end group/usermsg">
        <div className="max-w-2xl bg-dark-800 border border-dark-750/80 text-dark-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm select-text">
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        </div>

        {/* User Message Action Buttons: Edit, Revert, Copy */}
        <div className="flex items-center gap-1.5 mt-1 mr-1 opacity-0 group-hover/usermsg:opacity-100 transition text-[11px] text-dark-400">
          {onEditPrompt && (
            <button
              onClick={() => onEditPrompt(text)}
              className="flex items-center gap-1 hover:text-amber-300 transition px-1.5 py-0.5 rounded hover:bg-dark-800"
              title="Edit this request in the input editor"
            >
              <Edit3 size={11} className="text-amber-400" />
              <span>Edit</span>
            </button>
          )}

          {onRevertPrompt && (
            <button
              onClick={() => onRevertPrompt(index, text)}
              className="flex items-center gap-1 hover:text-red-300 transition px-1.5 py-0.5 rounded hover:bg-dark-800"
              title="Rollback conversation to before this prompt and edit it"
            >
              <RotateCcw size={11} className="text-red-400" />
              <span>Revert</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-dark-200 transition px-1.5 py-0.5 rounded hover:bg-dark-800"
            title="Copy request text"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 text-sm group">
      <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 flex-shrink-0 mt-0.5 shadow-sm">
        <Bot size={15} className="text-pi-accent" />
      </div>

      <div className="flex-1 space-y-3 min-w-0">
        {thinking && <ThinkingBlock thinking={thinking} />}

        {toolCalls.map((tc, idx) => (
          <ToolCallItem key={idx} toolCall={tc} />
        ))}

        {text && (
          <div className="text-dark-100 leading-relaxed font-sans prose-dark whitespace-pre-wrap select-text">
            {text}
          </div>
        )}

        {message.errorMessage && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            <span>{message.errorMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition text-xs text-dark-500">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-dark-300 transition"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ThinkingBlock: React.FC<{ thinking: string; isStreaming?: boolean }> = ({ thinking, isStreaming }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-dark-800 bg-dark-900/40 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-1.5 flex items-center justify-between text-dark-400 hover:text-dark-200 transition"
      >
        <div className="flex items-center gap-2">
          <Brain size={13} className="text-purple-400" />
          <span className="font-medium">Thinking Process</span>
          {isStreaming && <span className="text-[10px] text-purple-400 animate-pulse">(reasoning...)</span>}
        </div>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      {open && (
        <div className="px-3 py-2 border-t border-dark-800/80 bg-dark-950/60 text-dark-300 italic text-[11px] leading-relaxed whitespace-pre-wrap select-text">
          {thinking}
        </div>
      )}
    </div>
  );
};
