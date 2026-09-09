import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Folder, ExternalLink, Code, FileText, ChevronRight, Check } from 'lucide-react';
import { PiSkill } from '../../types/pi';

interface SkillManagerProps {
  projectDir?: string;
  onRefreshPiState: () => void;
}

export const SkillManagerView: React.FC<SkillManagerProps> = ({ projectDir, onRefreshPiState }) => {
  const [skills, setSkills] = useState<PiSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<PiSkill | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Creator state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newScope, setNewScope] = useState<'global' | 'project'>('global');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSkills();
  }, [projectDir]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const list = await (window as any).electronAPI.listSkills(projectDir);
      setSkills(list || []);
      if (list && list.length > 0 && !selectedSkill) {
        setSelectedSkill(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async () => {
    if (!newName.trim() || !newDesc.trim()) return;

    setCreating(true);
    try {
      const res = await (window as any).electronAPI.createSkill({
        name: newName.trim(),
        description: newDesc.trim(),
        instructions: newInstructions.trim(),
        scope: newScope,
        projectDir
      });

      if (res.success) {
        setShowCreateModal(false);
        setNewName('');
        setNewDesc('');
        setNewInstructions('');
        await loadSkills();
        onRefreshPiState();
      } else {
        alert(res.error || 'Failed to create skill');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSkill = async (skill: PiSkill) => {
    if (!confirm(`Delete skill "${skill.name}"?`)) return;

    try {
      const success = await (window as any).electronAPI.deleteSkill(skill.path);
      if (success) {
        if (selectedSkill?.name === skill.name) setSelectedSkill(null);
        await loadSkills();
        onRefreshPiState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const globalSkills = skills.filter(s => s.source === 'global');
  const projectSkills = skills.filter(s => s.source === 'project');
  const packageSkills = skills.filter(s => s.source === 'package');

  return (
    <div className="flex-1 flex flex-col h-full bg-dark-900 text-dark-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-dark-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <span>Skills Manager</span>
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">Agent skills loaded on-demand for specialized workflows</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white text-xs font-medium transition shadow-sm"
        >
          <Plus size={14} />
          <span>Create Skill</span>
        </button>
      </div>

      {/* Main split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Skills Explorer */}
        <div className="w-72 border-r border-dark-800 overflow-y-auto p-4 space-y-4">
          {/* Global Group */}
          <div>
            <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider px-2 mb-1.5">
              GLOBAL ({globalSkills.length})
            </div>
            <div className="space-y-0.5">
              {globalSkills.map(s => (
                <button
                  key={s.path}
                  onClick={() => setSelectedSkill(s)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition flex items-center justify-between ${selectedSkill?.path === s.path ? 'bg-dark-800 text-white font-medium' : 'text-dark-300 hover:bg-dark-850'}`}
                >
                  <span className="truncate">{s.name}</span>
                  {selectedSkill?.path === s.path && <ChevronRight size={13} className="text-pi-accent" />}
                </button>
              ))}
              {globalSkills.length === 0 && (
                <div className="px-2 text-xs text-dark-500 italic">No global skills</div>
              )}
            </div>
          </div>

          {/* Project Group */}
          <div>
            <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider px-2 mb-1.5">
              PROJECT ({projectSkills.length})
            </div>
            <div className="space-y-0.5">
              {projectSkills.map(s => (
                <button
                  key={s.path}
                  onClick={() => setSelectedSkill(s)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition flex items-center justify-between ${selectedSkill?.path === s.path ? 'bg-dark-800 text-white font-medium' : 'text-dark-300 hover:bg-dark-850'}`}
                >
                  <span className="truncate">{s.name}</span>
                  {selectedSkill?.path === s.path && <ChevronRight size={13} className="text-pi-accent" />}
                </button>
              ))}
              {projectSkills.length === 0 && (
                <div className="px-2 text-xs text-dark-500 italic">No project skills</div>
              )}
            </div>
          </div>

          {/* Package Group */}
          <div>
            <div className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider px-2 mb-1.5">
              PACKAGE ({packageSkills.length})
            </div>
            <div className="space-y-0.5">
              {packageSkills.map(s => (
                <button
                  key={s.path}
                  onClick={() => setSelectedSkill(s)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition flex items-center justify-between ${selectedSkill?.path === s.path ? 'bg-dark-800 text-white font-medium' : 'text-dark-300 hover:bg-dark-850'}`}
                >
                  <span className="truncate">{s.name}</span>
                  {selectedSkill?.path === s.path && <ChevronRight size={13} className="text-pi-accent" />}
                </button>
              ))}
              {packageSkills.length === 0 && (
                <div className="px-2 text-xs text-dark-500 italic">No package skills</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Skill Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedSkill ? (
            <div className="max-w-2xl space-y-5">
              <div className="flex items-start justify-between border-b border-dark-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white font-mono">{selectedSkill.name}</h3>
                  <p className="text-xs text-dark-400 mt-1">{selectedSkill.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-[11px] font-semibold uppercase bg-dark-800 border border-dark-700 text-dark-300">
                    {selectedSkill.source}
                  </span>
                  {selectedSkill.source !== 'package' && (
                    <button
                      onClick={() => handleDeleteSkill(selectedSkill)}
                      className="p-1.5 text-red-400 hover:bg-dark-800 rounded transition"
                      title="Delete skill"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Path info */}
              <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 text-xs font-mono text-dark-400 truncate">
                <span className="text-dark-500">Path: </span>
                <span>{selectedSkill.path}</span>
              </div>

              {/* SKILL.md Content */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-dark-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} className="text-dark-400" />
                  <span>SKILL.md Preview</span>
                </div>
                <pre className="p-4 rounded-xl bg-dark-950 border border-dark-800 text-xs font-mono text-dark-200 whitespace-pre-wrap leading-relaxed select-text">
                  {selectedSkill.content || '(Empty skill instructions)'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center h-full text-xs text-dark-500">
              Select a skill to inspect its instructions and metadata
            </div>
          )}
        </div>
      </div>

      {/* Skill Creator Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-xl w-full p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>Create New Skill</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-dark-400 font-medium">Skill Name (lowercase-hyphens)</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. blender-shader-development"
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs font-mono text-dark-100 outline-none focus:border-pi-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-dark-400 font-medium">Description (max 1024 chars)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What this skill does and when the agent should use it..."
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg px-3 py-2 text-xs text-dark-100 outline-none focus:border-pi-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-dark-400 font-medium">Skill Instructions (Markdown)</label>
                <textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="# Instructions&#10;&#10;Follow these step-by-step guidelines..."
                  rows={6}
                  className="w-full bg-dark-950 border border-dark-700 rounded-lg p-3 text-xs font-mono text-dark-100 outline-none focus:border-pi-accent leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center gap-4 text-xs pt-1">
                <label className="text-dark-400 font-medium">Scope:</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={newScope === 'global'}
                    onChange={() => setNewScope('global')}
                    className="text-pi-accent"
                  />
                  <span>Global (`~/.pi/agent/skills/`)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={newScope === 'project'}
                    onChange={() => setNewScope('project')}
                    className="text-pi-accent"
                  />
                  <span>Project (`.pi/skills/`)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-dark-800 text-xs">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-dark-700 text-dark-300 hover:bg-dark-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSkill}
                disabled={creating || !newName.trim() || !newDesc.trim()}
                className="px-4 py-1.5 rounded-lg bg-pi-accent hover:bg-pi-hover text-white font-medium transition"
              >
                {creating ? 'Creating...' : 'Create Skill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
