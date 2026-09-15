import { PiSlashCommand } from '../types/pi';

export const BUILTIN_SLASH_COMMANDS: PiSlashCommand[] = [
  {
    name: 'help',
    description: 'Display all available slash commands, controls, and shortcuts',
    source: 'builtin',
    category: 'General'
  },
  {
    name: 'compact',
    description: 'Manually compact session context to save tokens and improve speed',
    argumentHint: '[instructions]',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'new',
    description: 'Start a fresh new conversation session',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'clear',
    description: 'Clear current conversation messages and start fresh',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'session',
    description: 'Show session info, tokens, cost, and context metrics',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'stats',
    description: 'Alias for /session (view token usage and billing metrics)',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'model',
    description: 'Select or switch active AI model',
    argumentHint: '[provider/model]',
    source: 'builtin',
    category: 'Model'
  },
  {
    name: 'models',
    description: 'Open the model picker to browse and search models',
    source: 'builtin',
    category: 'Model'
  },
  {
    name: 'thinking',
    description: 'Set reasoning effort level (off, minimal, low, medium, high)',
    argumentHint: '<level>',
    source: 'builtin',
    category: 'Model'
  },
  {
    name: 'name',
    description: 'Set session display title',
    argumentHint: '<title>',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'export',
    description: 'Export session transcript to HTML or JSON',
    argumentHint: '[html|json]',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'settings',
    description: 'Open application and model provider settings',
    source: 'builtin',
    category: 'Navigation'
  },
  {
    name: 'skills',
    description: 'Browse and manage installed agent skills',
    source: 'builtin',
    category: 'Navigation'
  },
  {
    name: 'prompts',
    description: 'Browse and create reusable prompt templates',
    source: 'builtin',
    category: 'Navigation'
  },
  {
    name: 'packages',
    description: 'Browse and configure extensions and npm packages',
    source: 'builtin',
    category: 'Navigation'
  },
  {
    name: 'themes',
    description: 'Browse and customize visual themes',
    source: 'builtin',
    category: 'Navigation'
  },
  {
    name: 'fork',
    description: 'Create a new fork from a previous user message',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'clone',
    description: 'Duplicate current session at this point',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'tree',
    description: 'View session branch tree',
    source: 'builtin',
    category: 'Session'
  },
  {
    name: 'abort',
    description: 'Stop the active agent run immediately',
    source: 'builtin',
    category: 'Control'
  }
];

export function mergeSlashCommands(rawRpcCommands: any[]): PiSlashCommand[] {
  const result: PiSlashCommand[] = [...BUILTIN_SLASH_COMMANDS];
  const seen = new Set(result.map(c => c.name.toLowerCase()));

  if (Array.isArray(rawRpcCommands)) {
    for (const rpcCmd of rawRpcCommands) {
      if (!rpcCmd || !rpcCmd.name) continue;
      const cleanName = rpcCmd.name.startsWith('/') ? rpcCmd.name.slice(1) : rpcCmd.name;
      const lower = cleanName.toLowerCase();
      if (seen.has(lower)) continue;

      let category = 'Extension';
      let source: PiSlashCommand['source'] = 'extension';

      if (rpcCmd.source === 'skill' || cleanName.startsWith('skill:')) {
        category = 'Skill';
        source = 'skill';
      } else if (rpcCmd.source === 'prompt') {
        category = 'Prompt';
        source = 'prompt';
      }

      result.push({
        name: cleanName,
        description: rpcCmd.description || `Execute /${cleanName}`,
        argumentHint: rpcCmd.argumentHint,
        source,
        category
      });
      seen.add(lower);
    }
  }

  return result;
}

export function filterSlashCommands(query: string, allCommands: PiSlashCommand[]): PiSlashCommand[] {
  const cleanQ = query.trim().startsWith('/') ? query.trim().slice(1).toLowerCase() : query.trim().toLowerCase();
  if (!cleanQ) {
    return allCommands;
  }

  // Exact startsWith gets highest priority, followed by includes in name, then description
  const startsWithName: PiSlashCommand[] = [];
  const includesInName: PiSlashCommand[] = [];
  const includesInDesc: PiSlashCommand[] = [];

  for (const cmd of allCommands) {
    const nameLower = cmd.name.toLowerCase();
    const descLower = (cmd.description || '').toLowerCase();

    if (nameLower.startsWith(cleanQ)) {
      startsWithName.push(cmd);
    } else if (nameLower.includes(cleanQ)) {
      includesInName.push(cmd);
    } else if (descLower.includes(cleanQ)) {
      includesInDesc.push(cmd);
    }
  }

  return [...startsWithName, ...includesInName, ...includesInDesc];
}

export function generateHelpMarkdown(commands: PiSlashCommand[]): string {
  const builtins = commands.filter(c => c.source === 'builtin');
  const skills = commands.filter(c => c.source === 'skill');
  const extensions = commands.filter(c => c.source === 'extension');
  const prompts = commands.filter(c => c.source === 'prompt');

  const sessionCmds = builtins.filter(c => c.category === 'Session' || c.category === 'Control');
  const modelCmds = builtins.filter(c => c.category === 'Model');
  const navCmds = builtins.filter(c => c.category === 'Navigation');
  const generalCmds = builtins.filter(c => c.category === 'General');

  let md = `### ⚡ Available Slash Commands & Controls\n\n`;

  md += `#### 💬 Session & Control\n`;
  for (const c of [...generalCmds, ...sessionCmds]) {
    const hint = c.argumentHint ? ` \`${c.argumentHint}\`` : '';
    md += `- **\`/${c.name}\`**${hint} — ${c.description}\n`;
  }

  md += `\n#### 🧠 Model & Reasoning\n`;
  for (const c of modelCmds) {
    const hint = c.argumentHint ? ` \`${c.argumentHint}\`` : '';
    md += `- **\`/${c.name}\`**${hint} — ${c.description}\n`;
  }

  md += `\n#### 🛠 Navigation & Workspace\n`;
  for (const c of navCmds) {
    md += `- **\`/${c.name}\`** — ${c.description}\n`;
  }

  md += `\n#### 💻 Shell Commands\n`;
  md += `- **\`!<command>\`** — Run bash/shell command with output added to context\n`;
  md += `- **\`!!<command>\`** — Run bash/shell command silently (excluded from context)\n`;

  if (skills.length > 0) {
    md += `\n#### ⚡ Installed Skills (${skills.length})\n`;
    for (const s of skills.slice(0, 15)) {
      md += `- **\`/${s.name}\`** — ${s.description}\n`;
    }
    if (skills.length > 15) {
      md += `*...and ${skills.length - 15} more skills (type \`/skill:\` to autocomplete)*\n`;
    }
  }

  if (extensions.length > 0) {
    md += `\n#### 🔌 Extensions (${extensions.length})\n`;
    for (const e of extensions.slice(0, 10)) {
      md += `- **\`/${e.name}\`** — ${e.description}\n`;
    }
    if (extensions.length > 10) {
      md += `*...and ${extensions.length - 10} more extension commands*\n`;
    }
  }

  if (prompts.length > 0) {
    md += `\n#### 📝 Prompt Templates (${prompts.length})\n`;
    for (const p of prompts.slice(0, 8)) {
      md += `- **\`/${p.name}\`** — ${p.description}\n`;
    }
  }

  return md;
}
