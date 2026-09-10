export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  type: 'dark' | 'light';
  isCustom?: boolean;
  colors: {
    bg950: string;
    bg900: string;
    bg850: string;
    bg800: string;
    border800: string;
    border750: string;
    border700: string;
    text100: string;
    text200: string;
    text300: string;
    text400: string;
    text500: string;
    accent: string;
    accentHover: string;
    accentSubtle: string;
  };
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Obsidian Slate (Default)',
    description: 'The official Pi coding agent dark theme with emerald accent.',
    type: 'dark',
    colors: {
      bg950: '#09090b',
      bg900: '#121214',
      bg850: '#18181b',
      bg800: '#202024',
      border800: '#27272a',
      border750: '#303036',
      border700: '#3f3f46',
      text100: '#ffffff',
      text200: '#e4e4e7',
      text300: '#a1a1aa',
      text400: '#71717a',
      text500: '#52525b',
      accent: '#10a37f',
      accentHover: '#0d8a6a',
      accentSubtle: 'rgba(16, 163, 127, 0.15)'
    }
  },
  {
    id: 'oled',
    name: 'OLED Pure Black',
    description: 'High-contrast pitch black theme optimized for OLED displays.',
    type: 'dark',
    colors: {
      bg950: '#000000',
      bg900: '#070708',
      bg850: '#0e0e11',
      bg800: '#16161a',
      border800: '#222226',
      border750: '#2c2c33',
      border700: '#3d3d45',
      text100: '#ffffff',
      text200: '#ededed',
      text300: '#a1a1aa',
      text400: '#71717a',
      text500: '#52525b',
      accent: '#ffffff',
      accentHover: '#d4d4d8',
      accentSubtle: 'rgba(255, 255, 255, 0.12)'
    }
  },
  {
    id: 'nord',
    name: 'Nord Arctic',
    description: 'Cool arctic blue and muted polar night tones.',
    type: 'dark',
    colors: {
      bg950: '#242933',
      bg900: '#2e3440',
      bg850: '#353c4a',
      bg800: '#3b4252',
      border800: '#434c5e',
      border750: '#4c566a',
      border700: '#5e6a82',
      text100: '#eceff4',
      text200: '#e5e9f0',
      text300: '#d8dee9',
      text400: '#9ba3b4',
      text500: '#788194',
      accent: '#88c0d0',
      accentHover: '#81a1c1',
      accentSubtle: 'rgba(136, 192, 208, 0.16)'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula Cyber',
    description: 'Iconic violet and dark slate theme with vibrant accents.',
    type: 'dark',
    colors: {
      bg950: '#1e1f29',
      bg900: '#282a36',
      bg850: '#2f3242',
      bg800: '#383a59',
      border800: '#44475a',
      border750: '#52566d',
      border700: '#6272a4',
      text100: '#f8f8f2',
      text200: '#e2e2dc',
      text300: '#bfbfb8',
      text400: '#9ea0a6',
      text500: '#6272a4',
      accent: '#bd93f9',
      accentHover: '#ff79c6',
      accentSubtle: 'rgba(189, 147, 249, 0.16)'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Deep midnight indigo palette celebrating the lights of downtown Tokyo.',
    type: 'dark',
    colors: {
      bg950: '#16161e',
      bg900: '#1a1b26',
      bg850: '#1f2335',
      bg800: '#24283b',
      border800: '#2f3549',
      border750: '#384059',
      border700: '#414868',
      text100: '#c0caf5',
      text200: '#a9b1d6',
      text300: '#9aa5ce',
      text400: '#787c99',
      text500: '#565f89',
      accent: '#7aa2f7',
      accentHover: '#7dcfff',
      accentSubtle: 'rgba(122, 162, 247, 0.16)'
    }
  },
  {
    id: 'monokai',
    name: 'Monokai Pro',
    description: 'Warm, refined filter designed for ergonomic code reading.',
    type: 'dark',
    colors: {
      bg950: '#19181a',
      bg900: '#221f22',
      bg850: '#2a272b',
      bg800: '#343136',
      border800: '#403e43',
      border750: '#4c4a50',
      border700: '#5c5961',
      text100: '#fcfcfa',
      text200: '#e8e8e6',
      text300: '#c1c0be',
      text400: '#939290',
      text500: '#727072',
      accent: '#ffd866',
      accentHover: '#e6c257',
      accentSubtle: 'rgba(255, 216, 102, 0.16)'
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark Pro',
    description: 'The balanced Atom and VS Code syntax theme.',
    type: 'dark',
    colors: {
      bg950: '#1e1e24',
      bg900: '#21252b',
      bg850: '#242930',
      bg800: '#282c34',
      border800: '#3b4048',
      border750: '#4b5263',
      border700: '#5c6370',
      text100: '#ffffff',
      text200: '#abb2bf',
      text300: '#9da5b4',
      text400: '#6f7786',
      text500: '#5c6370',
      accent: '#61afef',
      accentHover: '#4d97d4',
      accentSubtle: 'rgba(97, 175, 239, 0.16)'
    }
  },
  {
    id: 'light',
    name: 'Clean Daylight',
    description: 'Crisp minimal light mode with high-contrast slate surfaces.',
    type: 'light',
    colors: {
      bg950: '#f4f4f6',
      bg900: '#ffffff',
      bg850: '#f8f9fa',
      bg800: '#edeef1',
      border800: '#e2e4e8',
      border750: '#d1d5db',
      border700: '#9ca3af',
      text100: '#09090b',
      text200: '#18181b',
      text300: '#3f3f46',
      text400: '#71717a',
      text500: '#a1a1aa',
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSubtle: 'rgba(2, 132, 199, 0.12)'
    }
  }
];

const STORAGE_KEY = 'pi_desktop_active_theme_id';

export class ThemeService {
  public static getActiveThemeId(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  }

  public static getBuiltinTheme(id: string): ThemeDefinition {
    return BUILTIN_THEMES.find(t => t.id === id) || BUILTIN_THEMES[0];
  }

  public static applyTheme(theme: ThemeDefinition) {
    if (!theme || !theme.colors) return;

    const root = document.documentElement;

    // Set CSS custom properties on :root
    root.style.setProperty('--color-dark-950', theme.colors.bg950);
    root.style.setProperty('--color-dark-900', theme.colors.bg900);
    root.style.setProperty('--color-dark-850', theme.colors.bg850);
    root.style.setProperty('--color-dark-800', theme.colors.bg800);
    root.style.setProperty('--color-dark-750', theme.colors.border750);
    root.style.setProperty('--color-dark-700', theme.colors.border700);
    root.style.setProperty('--color-dark-600', theme.colors.border800);
    root.style.setProperty('--color-dark-500', theme.colors.text500);
    root.style.setProperty('--color-dark-400', theme.colors.text400);
    root.style.setProperty('--color-dark-300', theme.colors.text300);
    root.style.setProperty('--color-dark-200', theme.colors.text200);
    root.style.setProperty('--color-dark-100', theme.colors.text100);

    root.style.setProperty('--color-pi-accent', theme.colors.accent);
    root.style.setProperty('--color-pi-accent-hover', theme.colors.accentHover);
    root.style.setProperty('--color-pi-accent-subtle', theme.colors.accentSubtle);

    // Toggle dark/light class
    if (theme.type === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    // Persist in localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme.id);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }

    // Synchronize to Pi's settings
    try {
      (window as any).electronAPI?.saveSettings?.({ theme: theme.id }, 'global');
    } catch {
      // Ignore
    }

    // Dispatch event for components that listen
    window.dispatchEvent(new CustomEvent('pi:theme-applied', { detail: theme }));
  }

  public static initTheme() {
    const savedId = this.getActiveThemeId();
    const theme = this.getBuiltinTheme(savedId);
    this.applyTheme(theme);
  }
}
