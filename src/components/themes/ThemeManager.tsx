import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { PiTheme } from '../../types/pi';

export const ThemeManagerView: React.FC = () => {
  const [themes, setThemes] = useState<PiTheme[]>([]);
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const list = await (window as any).electronAPI.listThemes(currentTheme);
      setThemes(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTheme = (name: string) => {
    setCurrentTheme(name);
    (window as any).electronAPI.saveSettings({ theme: name }, 'global');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      <div className="p-5 border-b border-dark-800">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Palette size={18} className="text-pink-400" />
          <span>Themes</span>
        </h2>
        <p className="text-xs text-dark-400 mt-0.5">Customize appearance and color schemes</p>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {themes.map((th) => (
          <div
            key={th.name}
            onClick={() => handleSelectTheme(th.name)}
            className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${currentTheme === th.name ? 'border-pi-accent bg-dark-800/90' : 'border-dark-800 bg-dark-950/60 hover:border-dark-700'}`}
          >
            <div className="flex items-center justify-between font-mono text-sm font-semibold text-white">
              <span>{th.name}</span>
              {currentTheme === th.name && <Check size={14} className="text-pi-accent" />}
            </div>
            <div className="mt-4 flex gap-1.5">
              <div className="w-5 h-5 rounded-full bg-dark-900 border border-dark-750" />
              <div className="w-5 h-5 rounded-full bg-dark-800 border border-dark-700" />
              <div className="w-5 h-5 rounded-full bg-pi-accent" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
