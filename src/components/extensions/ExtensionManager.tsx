import React, { useState } from 'react';
import { Layers, RefreshCw, CheckCircle2, XCircle, Settings2, Sliders } from 'lucide-react';
import { PiExtension } from '../../types/pi';
import { ExtensionOptionsModal } from './ExtensionOptionsModal';

export const ExtensionManagerView: React.FC<{ onRefreshPiState: () => void }> = ({ onRefreshPiState }) => {
  const [extensions, setExtensions] = useState<PiExtension[]>([
    { name: 'pi-bansos', source: 'npm:pi-bansos', status: 'enabled', location: 'package', description: 'Model provider and model catalog extension' },
    { name: 'pi-mcp-adapter', source: 'npm:pi-mcp-adapter', status: 'enabled', location: 'package', description: 'Model Context Protocol (MCP) bridge' },
    { name: 'pi-web-access', source: 'npm:pi-web-access', status: 'enabled', location: 'package', description: 'Web browsing and content scraping extension' },
    { name: 'memory.ts', source: '~/.pi/agent/extensions/memory.ts', status: 'disabled', location: 'global', description: 'Persistent conversation memory extension' },
    { name: 'pi-dynamic-context-pruning', source: 'npm:@complexthings/pi-dynamic-context-pruning', status: 'enabled', location: 'package', description: 'Adaptive context window optimization' }
  ]);

  const [selectedExtensionForOptions, setSelectedExtensionForOptions] = useState<PiExtension | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden select-none">
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            <span>Extensions</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Active Pi extensions registering tools, commands, providers, and UI</p>
        </div>

        <button
          onClick={onRefreshPiState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-750 text-xs font-medium transition"
        >
          <RefreshCw size={13} />
          <span>Reload Extensions</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
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
              {extensions.map((ext) => (
                <tr key={ext.name} className="hover:bg-dark-900/60 transition">
                  <td className="px-4 py-3 font-mono font-medium text-white">
                    <div>{ext.name}</div>
                    <div className="text-[11px] text-dark-400 font-sans mt-0.5">{ext.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${ext.status === 'enabled' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-dark-800 text-dark-400 border border-dark-700'}`}>
                      {ext.status === 'enabled' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {ext.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-dark-400 truncate max-w-xs">{ext.source}</td>
                  <td className="px-4 py-3 text-dark-300 capitalize">{ext.location}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedExtensionForOptions(ext)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-750 text-blue-400 hover:text-blue-300 border border-dark-700 font-medium text-xs transition"
                      title="Configure extension options & variables"
                    >
                      <Sliders size={12} />
                      <span>Options</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extension Options Dialog */}
      {selectedExtensionForOptions && (
        <ExtensionOptionsModal
          extension={selectedExtensionForOptions}
          onClose={() => setSelectedExtensionForOptions(null)}
          onSave={() => {
            onRefreshPiState();
          }}
        />
      )}
    </div>
  );
};

