import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PiTheme } from '../../src/types/pi';

export class ThemeManager {
  public static async discoverThemes(currentTheme = 'dark'): Promise<PiTheme[]> {
    const themes: PiTheme[] = [
      { name: 'dark', isCustom: false, isCurrent: currentTheme.startsWith('dark') },
      { name: 'light', isCustom: false, isCurrent: currentTheme === 'light' },
      { name: 'dark/dark', isCustom: false, isCurrent: currentTheme === 'dark/dark' }
    ];

    const userThemesDir = path.join(os.homedir(), '.pi', 'agent', 'themes');
    if (fs.existsSync(userThemesDir)) {
      try {
        const files = fs.readdirSync(userThemesDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const name = path.basename(file, '.json');
            themes.push({
              name,
              path: path.join(userThemesDir, file),
              isCustom: true,
              isCurrent: currentTheme === name
            });
          }
        }
      } catch {
        // Ignore
      }
    }

    return themes;
  }
}
