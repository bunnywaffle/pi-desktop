import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Check, Shield, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { PiExtension } from '../../types/pi';

interface ExtensionOptionsModalProps {
  extension: PiExtension | null;
  onClose: () => void;
  onSave: () => void;
}

export const ExtensionOptionsModal: React.FC<ExtensionOptionsModalProps> = ({
  extension,
  onClose,
  onSave
}) => {
  const [enabled, setEnabled] = useState(true);
  const [configJson, setConfigJson] = useState('{\n  "debug": false\n}');
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (extension) {
      setEnabled(extension.status === 'enabled');
      loadOptions();
    }
  }, [extension]);

  const loadOptions = async () => {
    if (!extension) return;
    try {
      if ((window as any).electronAPI?.getExtensionOptions) {
        const opts = await (window as any).electronAPI.getExtensionOptions(extension.name);
        if (opts && Object.keys(opts).length > 0) {
          if (opts.enabled !== undefined) setEnabled(opts.enabled);
          if (opts.config) setConfigJson(JSON.stringify(opts.config, null, 2));
          if (opts.env && typeof opts.env === 'object') {
            const arr = Object.entries(opts.env).map(([k, v]) => ({ key: k, value: String(v) }));
            setEnvVars(arr.length > 0 ? arr : [{ key: '', value: '' }]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!extension) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(configJson);
      } catch (err: any) {
        alert(`Invalid JSON config: ${err.message}`);
        setSaving(false);
        return;
      }

      const envObj: Record<string, string> = {};
      for (const item of envVars) {
        if (item.key.trim()) {
          envObj[item.key.trim()] = item.value;
        }
      }

      const payload = {
        enabled,
        config: parsedConfig,
        env: envObj,
        updatedAt: Date.now()
      };

      if ((window as any).electronAPI?.saveExtensionOptions) {
        await (window as any).electronAPI.saveExtensionOptions(extension.name, payload);
      }

      setSavedStatus(true);
      setTimeout(() => {
        setSavedStatus(false);
        onSave();
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(`Error saving options: ${err.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const addEnvRow = () => {
    setEnvVars(prev => [...prev, { key: '', value: '' }]);
  };

  const removeEnvRow = (idx: number) => {
    setEnvVars(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] text-xs">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Configure Extension: {extension.name}</h3>
              <p className="text-dark-400 text-[11px] truncate max-w-sm">{extension.source}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-dark-400 hover:text-white p-1">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-dark-800">
            <div>
              <div className="font-medium text-white">Extension Active Status</div>
              <div className="text-[11px] text-dark-400">Enable or disable this extension when Pi initializes</div>
            </div>

            <button
              onClick={() => setEnabled(!enabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${enabled ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-dark-800 text-dark-400 border border-dark-700'}`}
            >
              {enabled ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
              <span>{enabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* Environment Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-dark-200">Custom Environment Variables</label>
              <button
                onClick={addEnvRow}
                className="text-blue-400 hover:text-blue-300 text-[11px] font-medium"
              >
                + Add Variable
              </button>
            </div>
            <p className="text-[11px] text-dark-400">
              Injected into the process when Pi invokes this extension
            </p>

            <div className="space-y-2">
              {envVars.map((env, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="KEY_NAME"
                    value={env.key}
                    onChange={(e) => {
                      const copy = [...envVars];
                      copy[idx].key = e.target.value;
                      setEnvVars(copy);
                    }}
                    className="flex-1 bg-dark-950 border border-dark-750 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Value or API Key"
                    value={env.value}
                    onChange={(e) => {
                      const copy = [...envVars];
                      copy[idx].value = e.target.value;
                      setEnvVars(copy);
                    }}
                    className="flex-1 bg-dark-950 border border-dark-750 rounded-lg px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-blue-500"
                  />
                  {envVars.length > 1 && (
                    <button
                      onClick={() => removeEnvRow(idx)}
                      className="text-dark-500 hover:text-red-400 p-1"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extension Configuration JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-dark-200">Extension Parameters (JSON)</label>
              <span className="text-[10px] text-dark-500 font-mono">settings.json -&gt; extensions.{extension.name}</span>
            </div>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={5}
              className="w-full bg-dark-950 border border-dark-750 rounded-lg p-3 font-mono text-xs text-white outline-none focus:border-blue-500 select-text"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-800 flex items-center justify-between bg-dark-950/40">
          <div>
            {savedStatus && (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check size={14} /> Options saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-dark-700 text-dark-300 hover:bg-dark-800"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md transition disabled:opacity-50"
            >
              <Save size={13} />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
