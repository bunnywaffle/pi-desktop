import React, { useState } from 'react';
import { Terminal, Download, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PiInstallationInfo } from '../../types/pi';

interface PiSetupViewProps {
  info: PiInstallationInfo | null;
  onScan: () => void;
}

export const PiSetupView: React.FC<PiSetupViewProps> = ({ info, onScan }) => {
  const [selectedPm, setSelectedPm] = useState<'npm' | 'pnpm' | 'yarn' | 'bun' | 'installer-script'>('npm');
  const [installing, setInstalling] = useState(false);
  const [logs, setLogs] = useState('');
  const [installFinished, setInstallFinished] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    setLogs(`Starting installation with ${selectedPm}...\n`);
    setInstallFinished(false);

    const unsubscribe = (window as any).electronAPI.onInstallLog((chunk: string) => {
      setLogs(prev => prev + chunk);
    });

    try {
      const res = await (window as any).electronAPI.installPi(selectedPm);
      if (res.success) {
        setLogs(prev => prev + '\n✓ Done! Verifying installation...\n');
        onScan();
      } else {
        setLogs(prev => prev + `\n✗ Error: ${res.error || 'Failed'}\n`);
      }
    } catch (err: any) {
      setLogs(prev => prev + `\n✗ Error: ${err.message}\n`);
    } finally {
      unsubscribe();
      setInstalling(false);
      setInstallFinished(true);
    }
  };

  const getExactCommand = () => {
    switch (selectedPm) {
      case 'pnpm': return 'pnpm add -g @earendil-works/pi-coding-agent';
      case 'yarn': return 'yarn global add @earendil-works/pi-coding-agent';
      case 'bun': return 'bun add -g @earendil-works/pi-coding-agent';
      case 'installer-script': return 'curl -fsSL https://pi.dev/install.sh | bash';
      case 'npm':
      default:
        return 'npm install -g @earendil-works/pi-coding-agent';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-950 text-dark-200">
      <div className="max-w-xl w-full bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-pi-accent/15 border border-pi-accent/30 text-pi-accent flex items-center justify-center mx-auto shadow-sm">
            <Terminal size={24} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Pi Coding Agent Setup</h2>
          <p className="text-xs text-dark-400">
            Pi was not detected or needs to be installed to provide the core agent engine.
          </p>
        </div>

        {/* Package Manager Selection */}
        <div className="space-y-2">
          <label className="text-xs text-dark-400 font-medium">Select Installation Method</label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['npm', 'pnpm', 'yarn'] as const).map((pm) => (
              <button
                key={pm}
                onClick={() => setSelectedPm(pm)}
                className={`py-2 px-3 rounded-lg border text-center font-medium capitalize transition ${selectedPm === pm ? 'bg-pi-accent/20 border-pi-accent text-white' : 'bg-dark-800 border-dark-750 text-dark-400 hover:text-dark-200'}`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        {/* Exact Command Preview */}
        <div className="space-y-1">
          <label className="text-[11px] text-dark-400 font-mono">Command to execute:</label>
          <div className="p-3 bg-dark-950 border border-dark-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto select-text">
            $ {getExactCommand()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onScan}
            disabled={installing}
            className="flex-1 py-2 rounded-xl border border-dark-700 bg-dark-800 hover:bg-dark-750 text-dark-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            <RefreshCw size={13} className={installing ? 'animate-spin' : ''} />
            <span>Re-Scan System</span>
          </button>

          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 py-2 rounded-xl bg-pi-accent hover:bg-pi-hover text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Download size={14} />
            <span>{installing ? 'Installing...' : 'Install Pi'}</span>
          </button>
        </div>

        {/* Streaming Logs Panel */}
        {(logs || installing) && (
          <div className="space-y-1.5 pt-2 border-t border-dark-800">
            <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider">
              Installation Logs
            </div>
            <pre className="p-3 rounded-xl bg-dark-950 border border-dark-800 text-[11px] font-mono text-dark-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {logs}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
