import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, FileText } from 'lucide-react';
import { PiPromptTemplate } from '../../types/pi';

export const PromptManagerView: React.FC<{ projectDir?: string }> = ({ projectDir }) => {
  const [prompts, setPrompts] = useState<PiPromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PiPromptTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    loadPrompts();
  }, [projectDir]);

  const loadPrompts = async () => {
    try {
      const list = await (window as any).electronAPI.listPrompts(projectDir);
      setPrompts(list || []);
      if (list && list.length > 0 && !selectedPrompt) setSelectedPrompt(list[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return;
    await (window as any).electronAPI.savePrompt(name.trim(), content.trim(), 'global', projectDir);
    setShowCreateModal(false);
    setName('');
    setContent('');
    await loadPrompts();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" />
            <span>Prompt Templates</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Reusable prompt templates invoked with /template-name</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white text-xs font-medium transition"
        >
          <Plus size={14} />
          <span>New Prompt</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-dark-800 p-3 space-y-1 overflow-y-auto">
          {prompts.map(p => (
            <button
              key={p.path}
              onClick={() => setSelectedPrompt(p)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono truncate transition ${selectedPrompt?.path === p.path ? 'bg-dark-800 text-white font-medium' : 'text-dark-300 hover:bg-dark-850'}`}
            >
              /{p.name}
            </button>
          ))}
          {prompts.length === 0 && (
            <div className="p-3 text-xs text-dark-500 italic">No prompt templates found</div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {selectedPrompt ? (
            <div className="max-w-xl space-y-3">
              <h3 className="text-lg font-bold text-white font-mono">/{selectedPrompt.name}</h3>
              <pre className="p-4 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono text-dark-200 whitespace-pre-wrap leading-relaxed select-text">
                {selectedPrompt.content}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-dark-500">
              Select or create a prompt template
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-white">Create Prompt Template</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name (e.g. review-pr)"
              className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-dark-100 font-mono"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Prompt template markdown..."
              rows={6}
              className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-dark-100 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 border border-dark-700 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-pi-accent text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
