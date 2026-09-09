import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, CheckCircle2, XCircle, Sliders, FolderOpen, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { PiExtension } from '../../types/pi';
import { ExtensionOptionsModal } from './ExtensionOptionsModal';

interface ExtensionManagerProps {
  projectDir?: string;
  onRefreshPiState: () => void;
}

export const ExtensionManagerView: React.FC<ExtensionManagerProps> = ({ projectDir, onRefreshPiState }) => {
  const [extensions, setExtensions] = useState<PiExtension[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExtensionForOptions, setSelectedExtensionForOptions] = useState<PiExtension | null>(null);

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      if ((window as any).electronAPI?.listExtensions) {
        const list: PiExtension[] = await (window as any).electronAPI.listExtensions(projectDir);
        setExtensions(list || []);
      }
    } catch (err) {
      console.error('Failed to load extensions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [projectDir]);

  const handleToggle = async (ext: PiExtension) => {
    const newStatus = ext.status !== 'enabled';
    try {
      if ((window as any).electronAPI?.toggleExtension) {
        await (window as any).electronAPI.toggleExtension(ext.name, newStatus, projectDir);
        // Optimistically update
        setExtensions(prev => prev.map(e => e.name === ext.name ? { ...e, status: newStatus ? 'enabled' : 'disabled' } : e));
        onRefreshPiState();
      }
    } catch (err) {
      console.error('Failed to toggle extension:', err);
    }
  };

  const handleOpenFolder = async () => {
    try {
      if ((window as any).electronAPI?.openExtensionsFolder) {
        await (window as any).electronAPI.openExtensionsFolder();
      }
    } catch (err) {
      console.error('Failed to open extensions folder:', err);
    }
  };

  const filtered = extensions.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            <span>Extensions</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Active Pi extensions registering tools, commands, providers, and hooks</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-750 text-xs text-dark-300 hover:text-white font-medium transition"
            title="Open global extensions directory in file explorer"
          >
            <FolderOpen size={13} className="text-amber-400" />
            <span>Open Folder</span>
          </button>
          <button
            onClick={() => {
              fetchExtensions();
              onRefreshPiState();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-750 text-xs font-medium transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Search and stats bar */}
      <div className="px-5 py-3 border-b border-dark-800/80 bg-dark-950/40 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-2.5 text-dark-400" />
          <input
            type="text"
            placeholder="Search extensions by name, keyword, or source..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-dark-750 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-dark-500 outline-none focus:border-pi-accent select-text cursor-text"
          />
        </div>
        <div className="text-[11px] text-dark-400">
          Showing <span className="font-semibold text-white">{filtered.length}</span> of {extensions.length} extensions
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-dark-800 rounded-xl p-8">
            <Layers size={32} className="mx-auto text-dark-600 mb-2" />
            <div className="text-sm font-medium text-dark-300">No extensions found</div>
            <p className="text-xs text-dark-500 max-w-sm mx-auto mt-1">
              Add TypeScript or JavaScript extensions into <code className="text-pi-accent">~/.pi/agent/extensions</code> or install extensions from Packages.
            </p>
          </div>
        ) : (
          <div className="border border-dark-800 rounded-xl overflow-hidden bg-dark-950/60 shadow-sm text-xs">
            <table className="w-full text-left">
              <thead className="bg-dark-900 border-b border-dark-800 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Extension Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/80">
                {filtered.map((ext) => (
                  <tr key={ext.name} className="hover:bg-dark-900/60 transition">
                    <td className="px-4 py-3 font-mono font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span>{ext.name}</span>
                        {ext.location === 'global' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-sans">global</span>
                        )}
                        {ext.location === 'package' && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-sans">package</span>
                        )}
                      </div>
                      <div className="text-[11px] text-dark-400 font-sans mt-0.5 font-normal">{ext.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(ext)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase transition cursor-pointer ${
                          ext.status === 'enabled'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-dark-800 text-dark-400 border border-dark-700 hover:bg-dark-750'
                        }`}
                        title="Click to enable or disable"
                      >
                        {ext.status === 'enabled' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{ext.status}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-dark-400 truncate max-w-xs">{ext.source}</td>
                    <td className="px-4 py-3 text-dark-300 capitalize">{ext.location}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedExtensionForOptions(ext)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-750 text-blue-400 hover:text-blue-300 border border-dark-700 font-medium text-xs transition"
                          title="Configure extension options & environment variables"
                        >
                          <Sliders size={12} />
                          <span>Options</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extension Options Dialog */}
      {selectedExtensionForOptions && (
        <ExtensionOptionsModal
          extension={selectedExtensionForOptions}
          onClose={() => setSelectedExtensionForOptions(null)}
          onSave={() => {
            fetchExtensions();
            onRefreshPiState();
          }}
        />
      )}
    </div>
  );
};

