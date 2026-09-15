import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PiMessage, ToolCall } from '../../types/pi';
import { ToolCallItem } from './ToolCallItem';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Brain,
  Bot,
  AlertCircle,
  Edit3,
  RotateCcw,
  ArrowDown,
  Terminal,
  FileCode,
  Wrench
} from 'lucide-react';

interface MessageListProps {
  messages: PiMessage[];
  streamingText?: string;
  streamingThinking?: string;
  streamingToolCalls?: ToolCall[];
  isStreaming?: boolean;
  onEditPrompt?: (text: string) => void;
  onRevertPrompt?: (messageIndex: number, text: string) => void;
}

interface TurnToolCall {
  toolCall: ToolCall;
  result?: any;
  isError?: boolean;
}

interface ChatTurn {
  id: string;
  userMessage?: PiMessage;
  userIndex?: number;
  thinkings: string[];
  toolCalls: TurnToolCall[];
  assistantTexts: string[];
  errorMessage?: string;
  timestamp?: number;
}

/**
 * Group raw flat messages into cohesive conversational turns.
 * Each turn contains the user's prompt and the unified assistant actions/response,
 * pairing tool calls with their corresponding toolResult outputs.
 */
function groupMessagesIntoTurns(messages: PiMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let currentTurn: ChatTurn | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.role === 'user') {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        id: msg.id || `turn-${i}`,
        userMessage: msg,
        userIndex: i,
        thinkings: [],
        toolCalls: [],
        assistantTexts: [],
        errorMessage: undefined,
        timestamp: msg.timestamp
      };
    } else if (msg.role === 'assistant') {
      if (!currentTurn) {
        currentTurn = {
          id: msg.id || `turn-${i}`,
          userMessage: undefined,
          userIndex: undefined,
          thinkings: [],
          toolCalls: [],
          assistantTexts: [],
          errorMessage: undefined,
          timestamp: msg.timestamp
        };
      }

      if (typeof msg.content === 'string') {
        const clean = msg.content.replace(/<dcp-id>.*?<\/dcp-id>/gs, '').trim();
        if (clean) {
          currentTurn.assistantTexts.push(clean);
        }
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'thinking') {
            if (block.thinking && block.thinking.trim()) {
              currentTurn.thinkings.push(block.thinking);
            }
          } else if (block.type === 'toolCall') {
            currentTurn.toolCalls.push({
              toolCall: block,
              result: undefined,
              isError: false
            });
          } else if (block.type === 'text') {
            const clean = (block.text || '').replace(/<dcp-id>.*?<\/dcp-id>/gs, '').trim();
            if (clean) {
              currentTurn.assistantTexts.push(clean);
            }
          }
        }
      }

      if (msg.errorMessage) {
        currentTurn.errorMessage = msg.errorMessage;
      }
    } else if (msg.role === 'toolResult') {
      if (!currentTurn) {
        currentTurn = {
          id: `turn-tr-${i}`,
          thinkings: [],
          toolCalls: [],
          assistantTexts: [],
          errorMessage: undefined,
          timestamp: msg.timestamp
        };
      }

      // Pair toolResult with its corresponding toolCall
      let matched = currentTurn.toolCalls.find(tc => msg.toolCallId && tc.toolCall.id === msg.toolCallId);
      if (!matched) {
        // Fallback: match the latest tool call in this turn without a result
        matched = [...currentTurn.toolCalls].reverse().find(tc => tc.result === undefined);
      }

      if (matched) {
        matched.result = msg.content;
        matched.isError = !!msg.isError;
      } else {
        // Orphaned tool result
        currentTurn.toolCalls.push({
          toolCall: {
            type: 'toolCall',
            id: msg.toolCallId || `tr-${i}`,
            name: msg.toolName || 'tool',
            arguments: {}
          },
          result: msg.content,
          isError: !!msg.isError
        });
      }
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true);

  // User manually toggled expansion per turn
  const [expandedTurns, setExpandedTurns] = useState<Record<string, boolean>>({});

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distance = scrollHeight - scrollTop - clientHeight;
    const near = distance < 100;
    isNearBottomRef.current = near;
    setShowScrollBottom(distance > 120);
  };

  // Auto-scroll on content updates if user is near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [messages, streamingText, streamingThinking, streamingToolCalls, isStreaming, scrollToBottom]);

  // Compute conversational turns
  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages]);

  const toggleTurnExpanded = (turnId: string, currentState: boolean) => {
    setExpandedTurns(prev => ({
      ...prev,
      [turnId]: !currentState
    }));
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 max-w-3xl w-full mx-auto space-y-6 select-text"
      >
        {turns.map((turn, turnIdx) => {
          const isLastTurn = turnIdx === turns.length - 1;
          const hasExecutionSteps = turn.toolCalls.length > 0 || turn.thinkings.length > 0;

          // Default state: if completed, collapsed (false). If currently streaming on this turn, expanded (true).
          const isDefaultExpanded = isStreaming && isLastTurn;
          const isExpanded = expandedTurns[turn.id] !== undefined
            ? expandedTurns[turn.id]
            : isDefaultExpanded;

          return (
            <div key={turn.id} className="space-y-4">
              {/* User Prompt Bubble */}
              {turn.userMessage && (
                <UserMessageBubble
                  message={turn.userMessage}
                  index={turn.userIndex ?? turnIdx}
                  onEditPrompt={onEditPrompt}
                  onRevertPrompt={onRevertPrompt}
                />
              )}

              {/* Assistant Turn Content */}
              {(hasExecutionSteps || turn.assistantTexts.length > 0 || turn.errorMessage) && (
                <div className="flex gap-3 text-sm group">
                  <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot size={15} className="text-pi-accent" />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Collapsible Execution Panel for tool calls, reasonings, and commands */}
                    {hasExecutionSteps && (
                      <ExecutionStepsPanel
                        turnId={turn.id}
                        toolCalls={turn.toolCalls}
                        thinkings={turn.thinkings}
                        isStreaming={false}
                        expanded={isExpanded}
                        onToggle={() => toggleTurnExpanded(turn.id, isExpanded)}
                      />
                    )}

                    {/* Final Response Markdown */}
                    {turn.assistantTexts.map((txt, txtIdx) => (
                      <div key={txtIdx} className="min-w-0">
                        <MarkdownRenderer content={txt} />
                      </div>
                    ))}

                    {/* Error Message if any */}
                    {turn.errorMessage && (
                      <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-400" />
                        <span>{turn.errorMessage}</span>
                      </div>
                    )}

                    {/* Assistant Message Actions (Copy) */}
                    {turn.assistantTexts.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition text-xs text-dark-500">
                        <CopyAssistantButton texts={turn.assistantTexts} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Active Live Streaming State */}
        {isStreaming && (
          <div className="flex gap-3 text-sm">
            <div className="w-7 h-7 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300 flex-shrink-0 mt-0.5 shadow-sm">
              <Bot size={15} className="text-pi-accent animate-pulse" />
            </div>

            <div className="flex-1 space-y-3 min-w-0">
              {/* Live Streaming Execution Panel */}
              {(streamingThinking || streamingToolCalls.length > 0) && (
                <ExecutionStepsPanel
                  turnId="streaming-live"
                  toolCalls={streamingToolCalls.map(tc => ({ toolCall: tc }))}
                  thinkings={streamingThinking ? [streamingThinking] : []}
                  isStreaming={true}
                  expanded={expandedTurns['streaming-live'] !== undefined ? expandedTurns['streaming-live'] : true}
                  onToggle={() => toggleTurnExpanded('streaming-live', expandedTurns['streaming-live'] !== undefined ? expandedTurns['streaming-live'] : true)}
                />
              )}

              {/* Streaming Text Output */}
              {streamingText && (
                <div className="min-w-0">
                  <MarkdownRenderer content={streamingText} isStreaming={true} />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-dark-800 hover:bg-dark-750 text-dark-200 hover:text-white rounded-full border border-dark-700 shadow-2xl transition-all text-xs font-medium backdrop-blur-md animate-in fade-in zoom-in-95 group cursor-pointer"
            title="Scroll down to latest message"
          >
            <ArrowDown size={13} className="text-pi-accent group-hover:translate-y-0.5 transition-transform" />
            <span>Latest messages</span>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-pi-accent animate-ping ml-0.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Modern Collapsible Execution Panel
 * Houses all intermediate tool calls, terminal commands, outputs, and reasoning steps.
 * By default when task is completed, this panel is collapsed into a single sleek summary bar.
 */
const ExecutionStepsPanel: React.FC<{
  turnId: string;
  toolCalls: TurnToolCall[];
  thinkings: string[];
  isStreaming?: boolean;
  expanded: boolean;
  onToggle: () => void;
}> = ({ toolCalls, thinkings, isStreaming = false, expanded, onToggle }) => {
  const toolCount = toolCalls.length;
  const thinkingCount = thinkings.length;
  const hasError = toolCalls.some(tc => tc.isError);

  // Generate summary label
  const summaryLabel = useMemo(() => {
    const parts: string[] = [];

    if (toolCount > 0) {
      // Find distinct tool names
      const toolNames = Array.from(new Set(toolCalls.map(tc => tc.toolCall.name)));
      const nameStr = toolNames.join(', ');

      // Check if there are bash / powershell commands to highlight
      const firstCmd = toolCalls.find(tc => tc.toolCall.arguments?.command)?.toolCall.arguments?.command;
      if (firstCmd && toolCount === 1) {
        parts.push(`Ran $ ${firstCmd.slice(0, 35)}${firstCmd.length > 35 ? '...' : ''}`);
      } else {
        parts.push(`Ran ${toolCount} ${toolCount === 1 ? 'tool' : 'tools'} (${nameStr})`);
      }
    }

    if (thinkingCount > 0) {
      parts.push(toolCount > 0 ? 'Reasoned' : `Thought process (${thinkingCount} ${thinkingCount === 1 ? 'step' : 'steps'})`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'Execution Steps';
  }, [toolCalls, toolCount, thinkingCount]);

  // Choose icon based on primary action
  const primaryIcon = useMemo(() => {
    if (toolCalls.some(tc => ['bash', 'powershell'].includes(tc.toolCall.name))) {
      return <Terminal size={13} className="text-amber-400 shrink-0" />;
    }
    if (toolCalls.some(tc => ['read', 'write', 'edit', 'ls', 'grep'].includes(tc.toolCall.name))) {
      return <FileCode size={13} className="text-blue-400 shrink-0" />;
    }
    if (thinkingCount > 0) {
      return <Brain size={13} className="text-purple-400 shrink-0" />;
    }
    return <Wrench size={13} className="text-pi-accent shrink-0" />;
  }, [toolCalls, thinkingCount]);

  return (
    <div className="rounded-lg overflow-hidden border border-dark-800 transition-colors">
      {/* Sleek Summary Header Bar */}
      <div
        onClick={onToggle}
        className={`min-h-[34px] px-3 py-1.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
          expanded
            ? 'bg-dark-900 border-b border-dark-800'
            : 'bg-dark-900/70 hover:bg-dark-850/80 text-dark-300'
        }`}
        title={`${expanded ? 'Collapse' : 'Expand'} execution steps and tool calls`}
      >
        <div className="flex items-center gap-2 truncate flex-1 mr-2 text-xs">
          <button
            type="button"
            className="text-dark-400 hover:text-white transition p-0.5"
            tabIndex={-1}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
          {primaryIcon}
          <span className="font-medium text-dark-300 truncate">{summaryLabel}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Running...</span>
            </span>
          ) : hasError ? (
            <span className="flex items-center gap-1 text-red-400 font-medium text-[11px]">
              <AlertCircle size={11} />
              <span>Failed</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400/90 font-medium text-[11px]">
              <Check size={11} />
              <span>Completed</span>
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details Body */}
      {expanded && (
        <div className="p-3 bg-dark-950/70 space-y-3">
          {/* Reasonings / Thinking Blocks */}
          {thinkings.map((thought, idx) => (
            <ThinkingBlock key={`th-${idx}`} thinking={thought} isStreaming={isStreaming && idx === thinkings.length - 1} />
          ))}

          {/* Tool Calls & Outputs */}
          {toolCalls.map((tc, idx) => (
            <ToolCallItem
              key={tc.toolCall.id || `tc-${idx}`}
              toolCall={tc.toolCall}
              result={tc.result}
              isError={tc.isError}
              isStreaming={isStreaming && tc.result === undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ThinkingBlock: React.FC<{ thinking: string; isStreaming?: boolean }> = ({ thinking, isStreaming }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(thinking);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-lg border border-dark-800 bg-dark-900/50 overflow-hidden text-xs">
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-dark-800/80 bg-dark-900/80 text-dark-400">
        <div className="flex items-center gap-1.5">
          <Brain size={12} className="text-purple-400" />
          <span className="font-medium text-[11px] text-dark-300">Thinking Process</span>
          {isStreaming && <span className="text-[10px] text-purple-400 animate-pulse">(reasoning...)</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-dark-500 hover:text-dark-200 transition text-[10px]"
          title="Copy thinking text"
        >
          {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-3 bg-dark-950/90 text-dark-300 italic text-[11px] leading-relaxed whitespace-pre-wrap select-text font-mono max-h-56 overflow-y-auto">
        {thinking}
      </div>
    </div>
  );
};

const UserMessageBubble: React.FC<{
  message: PiMessage;
  index: number;
  onEditPrompt?: (text: string) => void;
  onRevertPrompt?: (messageIndex: number, text: string) => void;
}> = ({ message, index, onEditPrompt, onRevertPrompt }) => {
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n');
    }
    return '';
  }, [message.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col items-end group/usermsg">
      <div className="max-w-2xl bg-dark-800 border border-dark-750 text-dark-100 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm select-text">
        <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>

      {/* Action Buttons: Edit, Revert, Copy */}
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
};

const CopyAssistantButton: React.FC<{ texts: string[] }> = ({ texts }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(texts.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 hover:text-dark-300 transition"
      title="Copy response"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
};
