import { spawn } from 'child_process';
import * as os from 'os';

export interface InstallOptions {
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'installer-script';
  onLog: (chunk: string) => void;
}

export class PiInstaller {
  public static getInstallCommand(pm: InstallOptions['packageManager']): { cmd: string; args: string[]; display: string } {
    switch (pm) {
      case 'pnpm':
        return { cmd: 'pnpm', args: ['add', '-g', '@earendil-works/pi-coding-agent'], display: 'pnpm add -g @earendil-works/pi-coding-agent' };
      case 'yarn':
        return { cmd: 'yarn', args: ['global', 'add', '@earendil-works/pi-coding-agent'], display: 'yarn global add @earendil-works/pi-coding-agent' };
      case 'bun':
        return { cmd: 'bun', args: ['add', '-g', '@earendil-works/pi-coding-agent'], display: 'bun add -g @earendil-works/pi-coding-agent' };
      case 'installer-script':
        if (os.platform() === 'win32') {
          return { cmd: 'powershell', args: ['-Command', 'npm install -g @earendil-works/pi-coding-agent'], display: 'npm install -g @earendil-works/pi-coding-agent' };
        }
        return { cmd: 'sh', args: ['-c', 'curl -fsSL https://pi.dev/install.sh | bash'], display: 'curl -fsSL https://pi.dev/install.sh | bash' };
      case 'npm':
      default:
        return { cmd: 'npm', args: ['install', '-g', '@earendil-works/pi-coding-agent'], display: 'npm install -g @earendil-works/pi-coding-agent' };
    }
  }

  public static async install(options: InstallOptions): Promise<{ success: boolean; exitCode: number | null; error?: string }> {
    const { cmd, args, display } = this.getInstallCommand(options.packageManager);
    options.onLog(`[Installer] Executing: ${display}\n\n`);

    return new Promise((resolve) => {
      const isWin = os.platform() === 'win32';
      const child = spawn(cmd, args, {
        shell: isWin,
        env: { ...process.env, npm_config_loglevel: 'notice' }
      });

      let errOutput = '';

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        options.onLog(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        errOutput += text;
        options.onLog(text);
      });

      child.on('error', (err) => {
        options.onLog(`\n[Installer Error] ${err.message}\n`);
        resolve({ success: false, exitCode: -1, error: err.message });
      });

      child.on('close', (code) => {
        if (code === 0) {
          options.onLog(`\n[Installer] Pi successfully installed!\n`);
          resolve({ success: true, exitCode: code });
        } else {
          options.onLog(`\n[Installer] Installation failed with exit code ${code}.\n`);
          resolve({ success: false, exitCode: code, error: errOutput || `Process exited with code ${code}` });
        }
      });
    });
  }
}
