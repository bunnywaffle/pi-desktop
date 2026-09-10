import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, RefreshCw, AlertTriangle, ExternalLink, ShieldAlert, Check, Search } from 'lucide-react';
import { PiPackage } from '../../types/pi';

interface PackageManagerProps {
  projectDir?: string;
  onRefreshPiState: () => void;
}

export const PackageManagerView: React.FC<PackageManagerProps> = ({ projectDir, onRefreshPiState }) => {
  const [globalPkgs, setGlobalPkgs] = useState<PiPackage[]>([]);
  const [projectPkgs, setProjectPkgs] = useState<PiPackage[]>([]);
  const [popularPkgs, setPopularPkgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickInstallInput, setQuickInstallInput] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'discover'>('installed');
  const [installSource, setInstallSource] = useState('');
  const [installType, setInstallType] = useState<'npm' | 'git' | 'url' | 'local'>('npm');
  const [isProjectScope, setIsProjectScope] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installingSource, setInstallingSource] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPackages();
  }, [projectDir]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.listPackages(projectDir);
      setGlobalPkgs(res.global || []);
      setProjectPkgs(res.project || []);
      const popular = await (window as any).electronAPI.getPopularPackages();
      setPopularPkgs(popular || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPiDev = () => {
    if ((window as any).electronAPI?.openExternalUrl) {
      (window as any).electronAPI.openExternalUrl('https://pi.dev/packages');
    } else {
      window.open('https://pi.dev/packages', '_blank');
    }
  };

  const handleInstall = async (sourceToInstall?: string) => {
    const raw = sourceToInstall || installSource.trim() || quickInstallInput.trim();
    if (!raw) return;

    setInstalling(true);
    setInstallingSource(raw);
    setStatusMessage(null);
    try {
      let formatted = raw;
      if (sourceToInstall) {
        formatted = sourceToInstall;
      } else if (installType === 'npm' && !raw.startsWith('npm:') && !raw.startsWith('http') && !raw.startsWith('git')) {
        formatted = `npm:${raw}`;
      }
      const res = await (window as any).electronAPI.installPackage(formatted, isProjectScope, projectDir);
      if (res.success) {
        setStatusMessage({ type: 'success', text: `Package "${formatted}" installed successfully!` });
        setShowInstallModal(false);
        setInstallSource('');
        setQuickInstallInput('');
        await loadPackages();
        onRefreshPiState();
      } else {
        setStatusMessage({ type: 'error', text: res.output || 'Installation failed' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error occurred' });
    } finally {
      setInstalling(false);
      setInstallingSource(null);
    }
  };

  const handleRemove = async (pkg: PiPackage) => {
    if (!confirm(`Remove package "${pkg.name}"?\n\nThis will remove its extensions, skills, and prompts from settings.`)) return;

    try {
      const res = await (window as any).electronAPI.removePackage(pkg.source, pkg.scope === 'project', projectDir);
      if (res.success) {
        await loadPackages();
        onRefreshPiState();
      } else {
        alert(res.output || 'Failed to remove');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleUpdate = async (source?: string) => {
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.updatePackage(source);
      alert(res.output || 'Updated successfully');
      await loadPackages();
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const allInstalled = [...globalPkgs, ...projectPkgs];
  const filteredInstalled = allInstalled.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package size={18} className="text-purple-400" />
            <span>Packages</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Manage Pi extensions, skills, prompts, and themes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdate()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-700 bg-dark-800 hover:bg-dark-750 text-xs font-medium transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Update All</span>
          </button>

          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white text-xs font-medium transition shadow-sm"
          >
            <Plus size={14} />
            <span>Install Package</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="px-5 py-3 border-b border-dark-800 flex items-center justify-between bg-dark-950/40 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('installed')}
            className={`pb-1 font-medium transition border-b-2 ${activeTab === 'installed' ? 'border-pi-accent text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Installed ({allInstalled.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-1 font-medium transition border-b-2 ${activeTab === 'discover' ? 'border-pi-accent text-white' : 'border-transparent text-dark-400 hover:text-dark-200'}`}
          >
            Discovery Catalog
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-dark-800 border border-dark-700 w-56">
          <Search size={13} className="text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter packages..."
            className="bg-transparent outline-none text-xs text-dark-100 placeholder-dark-500 w-full"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border border-red-500/40 text-red-300'}`}>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {activeTab === 'installed' ? (
          <div className="space-y-4">
            {filteredInstalled.length === 0 ? (
              <div className="text-center py-12 text-dark-400 text-xs">
                No packages installed or matching search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredInstalled.map((pkg) => (
                  <div
                    key={`${pkg.source}-${pkg.scope}`}
                    className="p-4 rounded-xl border border-dark-750 bg-dark-900/80 hover:border-dark-700 transition space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-white text-sm font-mono truncate max-w-xs">
                          {pkg.name}
                        </div>
                        <div className="text-[11px] text-dark-400 font-mono truncate max-w-xs mt-0.5">
                          {pkg.source}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${pkg.scope === 'project' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'}`}>
                        {pkg.scope}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-dark-800 text-xs">
                      <button
                        onClick={() => handleUpdate(pkg.source)}
                        className="text-dark-400 hover:text-dark-200 flex items-center gap-1 transition"
                      >
                        <RefreshCw size={12} />
                        <span>Update</span>
                      </button>

                      <button
                        onClick={() => handleRemove(pkg)}
                        className="text-red-400/80 hover:text-red-400 flex items-center gap-1 transition"
                      >
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Discovery Catalog */
          <div className="space-y-4">
            {/* Online Registry Banner */}
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-purple-400" />
                  <span className="font-semibold text-white text-sm">Official Pi Packages Online</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                    pi.dev/packages
                  </span>
                </div>
                <p className="text-xs text-dark-300 leading-relaxed">
                  Browse official and verified community extensions, skills, tools, and prompts for your Pi coding agent.
                </p>
              </div>

              <button
                onClick={handleOpenPiDev}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition shadow-sm flex-shrink-0"
              >
                <ExternalLink size={13} />
                <span>Visit pi.dev/packages</span>
              </button>
            </div>

            {/* Quick Install Input Bar */}
            <div className="p-3.5 rounded-xl border border-dark-750 bg-dark-950/60 space-y-2">
              <label className="text-xs font-medium text-dark-300 flex items-center justify-between">
                <span>Download & Install Any Online Package:</span>
                <span className="text-[11px] text-dark-500 font-normal">Supports npm package, github repo, or direct url</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickInstallInput}
                  onChange={(e) => setQuickInstallInput(e.target.value)}
                  placeholder="e.g. @companion-ai/feynman, pi-web-access, or https://github.com/user/repo"
                  className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-dark-500 outline-none focus:border-purple-500 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInstall();
                  }}
                />
                <button
                  onClick={() => handleInstall()}
                  disabled={installing || !quickInstallInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover disabled:bg-dark-800 disabled:text-dark-500 text-white text-xs font-medium transition flex items-center gap-1.5 flex-shrink-0"
                >
                  {installing && installingSource === quickInstallInput.trim() ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Install</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
              {['all', 'Extensions', 'Tools', 'Skills', 'Providers'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition capitalize ${selectedCategory === cat ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200' : 'bg-dark-800/80 hover:bg-dark-800 border border-dark-750 text-dark-400 hover:text-dark-200'}`}
                >
                  {cat === 'all' ? 'All Packages' : cat}
                </button>
              ))}
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {popularPkgs
                .filter((pkg) => {
                  const matchCat = selectedCategory === 'all' || (pkg.category || '').toLowerCase() === selectedCategory.toLowerCase();
                  const matchQuery =
                    !searchQuery ||
                    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pkg.source.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchCat && matchQuery;
                })
                .map((pkg) => {
                  const isAlreadyInstalled = allInstalled.some(i => i.source === pkg.source || i.name === pkg.name);
                  const isThisInstalling = installing && installingSource === pkg.source;

                  return (
                    <div
                      key={pkg.source}
                      className="p-4 rounded-xl border border-dark-750 bg-dark-900/80 hover:border-dark-700 transition space-y-2.5 shadow-sm flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-sm font-mono truncate">{pkg.name}</div>
                            <div className="text-[11px] text-purple-400 font-mono mt-0.5">{pkg.resources}</div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {pkg.category && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-dark-800 text-dark-300 border border-dark-700">
                                {pkg.category}
                              </span>
                            )}
                            {isAlreadyInstalled && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-medium flex items-center gap-1 border border-emerald-500/30">
                                <Check size={10} /> Installed
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-dark-300 leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="pt-2.5 border-t border-dark-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-dark-500 font-mono truncate max-w-[180px]">
                          {pkg.source}
                        </span>

                        <button
                          onClick={() => handleInstall(pkg.source)}
                          disabled={installing || isAlreadyInstalled}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${isAlreadyInstalled ? 'bg-dark-800 text-dark-500 cursor-not-allowed' : isThisInstalling ? 'bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
                        >
                          {isThisInstalling ? (
                            <>
                              <RefreshCw size={11} className="animate-spin" />
                              <span>Installing...</span>
                            </>
                          ) : isAlreadyInstalled ? (
                            'Installed'
                          ) : (
                            <>
                              <Plus size={12} />
                              <span>Download</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Install Package Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Package size={16} className="text-purple-400" />
              <span>Install Package</span>
            </h3>

            {/* Security Notice */}
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
              <ShieldAlert size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-amber-300">Security Warning:</span> Pi packages run with your full user permissions and may execute arbitrary code or shell commands. Review source code before installing.
              </div>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400 font-medium">Source Type</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['npm', 'git', 'url', 'local'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setInstallType(t)}
                    className={`py-1.5 rounded-lg border text-center font-medium capitalize transition ${installType === t ? 'bg-pi-accent/20 border-pi-accent text-white' : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-dark-400 font-medium">Source</label>
              <input
                type="text"
                value={installSource}
                onChange={(e) => setInstallSource(e.target.value)}
                placeholder={
                  installType === 'npm' ? 'npm:@foo/bar@1.0.0' :
                  installType === 'git' ? 'git:github.com/user/repo' :
                  installType === 'url' ? 'https://github.com/user/repo' :
                  '/absolute/path/to/package'
                }
                className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs font-mono text-dark-100 outline-none focus:border-pi-accent"
              />
            </div>

            {/* Scope Switch */}
            <div className="flex items-center gap-2 text-xs text-dark-300">
              <input
                type="checkbox"
                id="scopeToggle"
                checked={isProjectScope}
                onChange={(e) => setIsProjectScope(e.target.checked)}
                className="rounded border-dark-700 text-pi-accent focus:ring-0"
              />
              <label htmlFor="scopeToggle">Install to Project Scope (`.pi/settings.json`) only</label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-dark-800 text-xs">
              <button
                onClick={() => setShowInstallModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-dark-700 text-dark-300 hover:bg-dark-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInstall()}
                disabled={installing || !installSource.trim()}
                className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white font-medium transition"
              >
                {installing ? 'Installing...' : 'Install'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
