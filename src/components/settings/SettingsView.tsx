import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Key, Sliders, FileCode, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2, Server, Globe } from 'lucide-react';
import { ProviderAuthStatus, CustomProviderConfig } from '../../types/pi';

interface SettingsViewProps {
  projectDir?: string;
  onRefreshPiState: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ projectDir, onRefreshPiState }) => {
  const [scope, setScope] = useState<'global' | 'project'>('global');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [jsonText, setJsonText] = useState('');
  const [providers, setProviders] = useState<ProviderAuthStatus[]>([]);
  const [customProviders, setCustomProviders] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'providers' | 'advanced'>('general');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Key editing modal
  const [editingProvider, setEditingProvider] = useState<ProviderAuthStatus | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Custom Provider modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModelsInput, setCustomModelsInput] = useState('');
  const [supportsDeveloperRole, setSupportsDeveloperRole] = useState(false);
  const [supportsReasoningEffort, setSupportsReasoningEffort] = useState(false);

  useEffect(() => {
    loadData();
  }, [scope, projectDir]);

  const loadData = async () => {
    try {
      const data = await (window as any).electronAPI.readSettings(scope, projectDir);
      setSettings(data || {});
      setJsonText(JSON.stringify(data || {}, null, 2));

      const provs = await (window as any).electronAPI.getProviderAuthStatuses();
      setProviders(provs || []);

      if ((window as any).electronAPI?.readModelsJson) {
        const modelsJson = await (window as any).electronAPI.readModelsJson(scope, projectDir);
        setCustomProviders(modelsJson?.providers || {});
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleSaveField = async (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setJsonText(JSON.stringify(updated, null, 2));

    const res = await (window as any).electronAPI.saveSettings(updated, scope, projectDir);
    if (res.success) {
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
      onRefreshPiState();
    }
  };

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      const res = await (window as any).electronAPI.saveSettings(parsed, scope, projectDir);
      if (res.success) {
        setSettings(parsed);
        setSaveStatus('JSON settings saved atomically!');
        setTimeout(() => setSaveStatus(null), 2500);
        onRefreshPiState();
      } else {
        alert(res.error || 'Failed to save');
      }
    } catch (err: any) {
      alert(`Invalid JSON: ${err.message}`);
    }
  };

  const handleSaveApiKey = async () => {
    if (!editingProvider) return;
    const res = await (window as any).electronAPI.saveProviderKey(editingProvider.id, apiKeyInput);
    if (res.success) {
      setEditingProvider(null);
      setApiKeyInput('');
      const provs = await (window as any).electronAPI.getProviderAuthStatuses();
      setProviders(provs || []);
      onRefreshPiState();
    } else {
      alert(res.error || 'Failed to save key');
    }
  };

  const handleSaveCustomProvider = async () => {
    if (!customId.trim() || !customBaseUrl.trim()) {
      alert('Provider ID and Base URL are required');
      return;
    }

    const modelIds = customModelsInput
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const providerConfig = {
      id: customId.trim(),
      name: customName.trim() || customId.trim(),
      baseUrl: customBaseUrl.trim(),
      api: 'openai-completions',
      apiKey: customApiKey.trim() || customId.trim(),
      compat: {
        supportsDeveloperRole,
        supportsReasoningEffort
      },
      models: modelIds.map(id => ({
        id,
        name: id,
        reasoning: supportsReasoningEffort
      }))
    };

    try {
      const res = await (window as any).electronAPI.saveCustomProvider(providerConfig, scope, projectDir);
      if (res.success) {
        setShowCustomModal(false);
        setCustomId('');
        setCustomName('');
        setCustomBaseUrl('');
        setCustomApiKey('');
        setCustomModelsInput('');
        setSupportsDeveloperRole(false);
        setSupportsReasoningEffort(false);
        await loadData();
        onRefreshPiState();
      } else {
        alert(res.error || 'Failed to save custom provider');
      }
    } catch (err: any) {
      alert(`Error: ${err.message || String(err)}`);
    }
  };

  const handleDeleteCustomProvider = async (pId: string) => {
    if (!confirm(`Delete custom provider "${pId}" from models.json?`)) return;
    try {
      const res = await (window as any).electronAPI.deleteCustomProvider(pId, scope, projectDir);
      if (res.success) {
        await loadData();
        onRefreshPiState();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      {/* Top Header & Scope Switch */}
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-cyan-400" />
            <span>Settings</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Configure models, providers, trust, and Pi runtime behavior</p>
        </div>

        {/* Scope Switcher */}
        <div className="flex items-center gap-2 bg-dark-950 border border-dark-750 p-1 rounded-lg text-xs">
          <button
            onClick={() => setScope('global')}
            className={`px-3 py-1 rounded-md transition font-medium ${scope === 'global' ? 'bg-dark-800 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
          >
            Global (`~/.pi/agent/`)
          </button>
          <button
            onClick={() => setScope('project')}
            className={`px-3 py-1 rounded-md transition font-medium ${scope === 'project' ? 'bg-dark-800 text-white shadow-sm' : 'text-dark-400 hover:text-dark-200'}`}
          >
            Project (`.pi/`)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-2.5 border-b border-dark-800/80 flex items-center justify-between bg-dark-950/40 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-1 font-medium transition border-b-2 flex items-center gap-1.5 ${activeTab === 'general' ? 'border-pi-accent text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            <Sliders size={13} />
            <span>General & Runtime</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-1 font-medium transition border-b-2 flex items-center gap-1.5 ${activeTab === 'providers' ? 'border-pi-accent text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            <Key size={13} />
            <span>Models & Providers</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`pb-1 font-medium transition border-b-2 flex items-center gap-1.5 ${activeTab === 'advanced' ? 'border-pi-accent text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            <FileCode size={13} />
            <span>Advanced JSON</span>
          </button>
        </div>

        {saveStatus && (
          <span className="text-emerald-400 font-medium text-xs animate-in fade-in">{saveStatus}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl space-y-6 text-xs">
            {/* Startup Model Configuration */}
            <div className="space-y-3 p-4 rounded-xl border border-dark-800 bg-dark-950/60">
              <h3 className="text-sm font-semibold text-white">Startup Defaults</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-dark-400 font-medium">Default Provider</label>
                  <input
                    type="text"
                    value={settings.defaultProvider || ''}
                    onChange={(e) => handleSaveField('defaultProvider', e.target.value)}
                    placeholder="e.g. bansos, anthropic, openai"
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-100 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-dark-400 font-medium">Default Thinking Level</label>
                  <select
                    value={settings.defaultThinkingLevel || 'medium'}
                    onChange={(e) => handleSaveField('defaultThinkingLevel', e.target.value)}
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-100 font-mono"
                  >
                    <option value="off">off</option>
                    <option value="minimal">minimal</option>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="xhigh">xhigh</option>
                    <option value="max">max</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-dark-400 font-medium">Default Model ID</label>
                <input
                  type="text"
                  value={settings.defaultModel || ''}
                  onChange={(e) => handleSaveField('defaultModel', e.target.value)}
                  placeholder="e.g. nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-100 font-mono"
                />
              </div>
            </div>

            {/* Project Trust */}
            <div className="space-y-3 p-4 rounded-xl border border-dark-800 bg-dark-950/60">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Shield size={14} className="text-amber-400" />
                <span>Project Trust Policy</span>
              </h3>
              <p className="text-dark-400 leading-relaxed">
                Controls whether Pi automatically trusts project-local settings and extensions.
              </p>
              <select
                value={settings.defaultProjectTrust || 'ask'}
                onChange={(e) => handleSaveField('defaultProjectTrust', e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-dark-100 font-mono"
              >
                <option value="ask">ask (Prompt before loading project extensions)</option>
                <option value="always">always (Always trust local project files)</option>
                <option value="never">never (Ignore project extensions)</option>
              </select>
            </div>

            {/* TUI and Display */}
            <div className="space-y-3 p-4 rounded-xl border border-dark-800 bg-dark-950/60">
              <h3 className="text-sm font-semibold text-white">Display & Behavior</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.hideThinkingBlock || false}
                    onChange={(e) => handleSaveField('hideThinkingBlock', e.target.checked)}
                    className="rounded border-dark-700 text-pi-accent"
                  />
                  <span>Hide thinking blocks in output</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quietStartup ?? true}
                    onChange={(e) => handleSaveField('quietStartup', e.target.checked)}
                    className="rounded border-dark-700 text-pi-accent"
                  />
                  <span>Quiet startup (suppress welcome header)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="max-w-3xl space-y-6 text-xs">
            {/* Custom OpenAI-Compatible Providers */}
            <div className="space-y-3 p-4 rounded-xl border border-dark-800 bg-dark-950/60 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Server size={15} className="text-emerald-400" />
                    <span>Custom Providers (OpenAI-Compatible & Local)</span>
                  </h3>
                  <p className="text-dark-400 mt-0.5">
                    Connect self-hosted LLMs (Ollama, LM Studio, vLLM) or OpenAI-compatible proxies in <code className="text-emerald-400 font-mono">models.json</code>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setCustomId('');
                    setCustomName('');
                    setCustomBaseUrl('http://localhost:11434/v1');
                    setCustomApiKey('');
                    setCustomModelsInput('llama3.2:latest, deepseek-r1:14b');
                    setSupportsDeveloperRole(false);
                    setSupportsReasoningEffort(false);
                    setShowCustomModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-sm"
                >
                  <Plus size={13} />
                  <span>Add Custom Provider</span>
                </button>
              </div>

              {Object.keys(customProviders).length > 0 ? (
                <div className="space-y-2 pt-2">
                  {Object.entries(customProviders).map(([pId, pCfg]: [string, any]) => (
                    <div
                      key={pId}
                      className="p-3 rounded-lg border border-dark-750 bg-dark-900/90 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{pCfg.name || pId}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-purple-300 border border-dark-700">
                            {pId}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-dark-400 truncate max-w-md">
                          Base URL: {pCfg.baseUrl}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          {(pCfg.models || []).map((m: any) => (
                            <span key={m.id} className="px-1.5 py-0.5 rounded bg-dark-950 border border-dark-800 font-mono text-[10px] text-dark-300">
                              {m.id}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteCustomProvider(pId)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-dark-500 hover:text-red-400 transition"
                          title="Delete provider"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-dark-800 rounded-lg text-dark-500 text-xs">
                  No custom providers configured yet. Click &quot;Add Custom Provider&quot; to connect Ollama, LM Studio, or OpenAI-compatible proxies.
                </div>
              )}
            </div>

            {/* Built-in Providers */}
            <div className="space-y-3 p-4 rounded-xl border border-dark-800 bg-dark-950/60 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key size={15} className="text-cyan-400" />
                  <span>Standard Model Providers</span>
                </h3>
                <p className="text-dark-400 mt-0.5">
                  Credentials managed in <code className="text-purple-400 font-mono">~/.pi/agent/auth.json</code> and environment variables
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-dark-800 bg-dark-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      {p.configured ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Configured ({p.source})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-800 text-dark-500 border border-dark-700 flex items-center gap-1">
                          <AlertCircle size={11} /> Missing key
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingProvider(p);
                        setApiKeyInput('');
                      }}
                      className="px-2.5 py-1 rounded bg-dark-800 hover:bg-dark-750 text-dark-200 border border-dark-700 transition"
                    >
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">Directly edit raw configuration JSON. Unknown keys will be preserved.</span>
              <button
                onClick={handleSaveJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white text-xs font-medium transition"
              >
                <Save size={13} />
                <span>Save JSON</span>
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={18}
              className="w-full bg-dark-950 border border-dark-750 rounded-xl p-4 font-mono text-xs text-dark-100 outline-none focus:border-pi-accent leading-relaxed select-text"
            />
          </div>
        )}
      </div>

      {/* Configure Key Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key size={15} className="text-pi-accent" />
              <span>Configure {editingProvider.name}</span>
            </h3>
            <p className="text-dark-400">
              API key will be saved securely to <code className="text-purple-400">~/.pi/agent/auth.json</code> with user permissions.
            </p>

            <div className="space-y-1">
              <label className="text-dark-400 font-medium">API Key</label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter API key or paste token..."
                className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-pi-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
              <button
                onClick={() => setEditingProvider(null)}
                className="px-3 py-1.5 border border-dark-700 rounded-lg text-dark-300 hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 bg-pi-accent text-white rounded-lg font-medium"
              >
                Save Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Provider Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in select-none">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-dark-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server size={16} className="text-emerald-400" />
                <span>Add Custom OpenAI-Compatible Provider</span>
              </h3>
              <button onClick={() => setShowCustomModal(false)} className="text-dark-400 hover:text-white">✕</button>
            </div>

            <p className="text-dark-400 text-[11px] leading-relaxed">
              Registers a new provider in Pi&apos;s <code className="text-emerald-400 font-mono">models.json</code> compatible with Ollama, LM Studio, vLLM, or corporate proxies.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-dark-300 font-medium">Provider ID *</label>
                <input
                  type="text"
                  placeholder="e.g. ollama, vllm, lmstudio"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-dark-300 font-medium">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Ollama Server"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-dark-300 font-medium">Base URL *</label>
              <input
                type="text"
                placeholder="e.g. http://localhost:11434/v1 or https://proxy.company.com/v1"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-dark-300 font-medium">API Key (Optional for local servers)</label>
              <input
                type="password"
                placeholder="Leave blank for local Ollama/LM Studio or enter token..."
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-dark-300 font-medium">Model IDs (Comma or newline separated)</label>
              <textarea
                placeholder="llama3.2:latest, deepseek-r1:14b, qwen2.5-coder:32b"
                value={customModelsInput}
                onChange={(e) => setCustomModelsInput(e.target.value)}
                rows={3}
                className="w-full bg-dark-950 border border-dark-750 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            {/* Compatibility flags */}
            <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 space-y-2">
              <div className="font-semibold text-dark-300 text-[11px]">Server Compatibility Settings</div>
              <label className="flex items-center gap-2 cursor-pointer text-dark-400 hover:text-dark-200">
                <input
                  type="checkbox"
                  checked={supportsDeveloperRole}
                  onChange={(e) => setSupportsDeveloperRole(e.target.checked)}
                  className="rounded border-dark-700 text-emerald-500"
                />
                <span>Supports Developer Role (Check if server supports developer messages, uncheck for Ollama)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-dark-400 hover:text-dark-200">
                <input
                  type="checkbox"
                  checked={supportsReasoningEffort}
                  onChange={(e) => setSupportsReasoningEffort(e.target.checked)}
                  className="rounded border-dark-700 text-emerald-500"
                />
                <span>Supports Reasoning Effort parameter</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-800">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 border border-dark-700 rounded-lg text-dark-300 hover:bg-dark-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomProvider}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm transition"
              >
                Save Provider to Pi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

