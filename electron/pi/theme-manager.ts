import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { shell } from 'electron';
import { PiTheme } from '../../src/types/pi';

export class ThemeManager {
  public static async discoverThemes(currentTheme = 'dark'): Promise<PiTheme[]> {
    const userThemesDir = path.join(os.homedir(), '.pi', 'agent', 'themes');
    if (!fs.existsSync(userThemesDir)) {
      try {
        fs.mkdirSync(userThemesDir, { recursive: true });
      } catch {
        // Ignore
      }
    }

    const themes: PiTheme[] = [];

    if (fs.existsSync(userThemesDir)) {
      try {
        const files = fs.readdirSync(userThemesDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const name = path.basename(file, '.json');
            const filePath = path.join(userThemesDir, file);
            let parsedColors: Record<string, string> | undefined;
            try {
              const raw = fs.readFileSync(filePath, 'utf-8');
              const json = JSON.parse(raw);
              parsedColors = json.colors || json.vars;
            } catch {
              // Ignore
            }

            themes.push({
              name,
              path: filePath,
              isCustom: true,
              isCurrent: currentTheme === name,
              colors: parsedColors
            });
          }
        }
      } catch {
        // Ignore
      }
    }

    return themes;
  }

  public static async openThemesFolder(): Promise<boolean> {
    const userThemesDir = path.join(os.homedir(), '.pi', 'agent', 'themes');
    if (!fs.existsSync(userThemesDir)) {
      try {
        fs.mkdirSync(userThemesDir, { recursive: true });
      } catch {
        // Ignore
      }
    }
    await shell.openPath(userThemesDir);
    return true;
  }
}
