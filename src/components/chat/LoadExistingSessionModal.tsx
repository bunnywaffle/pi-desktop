import React, { useState, useEffect } from 'react';
import { History, Search, X, Folder, Calendar, MessageSquare, ArrowRight, RefreshCw, Cpu } from 'lucide-react';
import { PiSessionSummary } from '../../types/pi';

interface LoadExistingSessionModalProps {
  onClose: () => void;
  onSelectSession: (session: PiSessionSummary & { projectDir?: string }) => void;
}

export const LoadExistingSessionModal: React.FC<LoadExistingSessionModalProps> = ({
  onClose,
  onSelectSession
}) => {
  const [sessions, setSessions] = useState<Array<PiSessionSummary & { projectDir?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      if ((window as any).electronAPI?.listAllRecentSessions) {
        const all = await (window as any).electronAPI.listAllRecentSessions();
        setSessions(all || []);
      }
    } catch (err) {
      console.error('Failed to load existing sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (s.name || '').toLowerCase().includes(q);
    const dirMatch = (s.cwd || s.projectDir || '').toLowerCase().includes(q);
    const modelMatch = (s.model || '').toLowerCase().includes(q);
    const msgMatch = (s.lastMessage || '').toLowerCase().includes(q);
    return nameMatch || dirMatch || modelMatch || msgMatch;
  });

  const formatDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
      <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] text-xs">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <History size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Load Existing Pi Session</h3>
              <p className="text-dark-400 text-[11px]">
                Browse and resume conversations saved in <code className="text-purple-300 font-mono">~/.pi/agent/sessions/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition"
              title="Refresh sessions list"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-dark-800 bg-dark-950/60">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-dark-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions by name, workspace folder, or model..."
              className="w-full bg-dark-900 border border-dark-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-dark-500 outline-none focus:border-purple-500 font-mono"
              autoFocus
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-dark-400 text-xs font-mono">
              Scanning Pi session files...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-dark-400 text-xs text-center space-y-1">
              <History size={24} className="text-dark-600 mb-1" />
              <p>No existing Pi sessions found.</p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-purple-400 hover:underline text-[11px]">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredSessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => {
                  onSelectSession(sess);
                  onClose();
                }}
                className="p-3 rounded-xl border border-dark-800 bg-dark-950/50 hover:bg-dark-800/80 hover:border-dark-700 cursor-pointer transition shadow-sm group flex items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs truncate group-hover:text-purple-300 transition">
                      {sess.name || sess.id}
                    </span>
                    {sess.messageCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-dark-800 border border-dark-700 text-[10px] text-dark-300 font-mono">
                        {sess.messageCount} msgs
                      </span>
                    )}
                  </div>

                  {(sess.cwd || sess.projectDir) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-dark-400 font-mono truncate">
                      <Folder size={11} className="text-dark-500 flex-shrink-0" />
                      <span className="truncate">{sess.cwd || sess.projectDir}</span>
                    </div>
                  )}

                  {sess.lastMessage && (
                    <div className="text-[11px] text-dark-400 truncate italic">
                      &quot;{sess.lastMessage}&quot;
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-dark-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(sess.timestamp)}
                    </span>
                    {sess.model && (
                      <span className="flex items-center gap-1 text-purple-400/80">
                        <Cpu size={10} />
                        {sess.model}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-dark-500 group-hover:text-white transition flex-shrink-0">
                  <span className="text-[11px] font-medium hidden group-hover:inline text-purple-400">Load</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-800 flex items-center justify-between bg-dark-950/40 text-[11px] text-dark-400">
          <span>{filteredSessions.length} total sessions found</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-dark-700 hover:bg-dark-800 text-dark-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
