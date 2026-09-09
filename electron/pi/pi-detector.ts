import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PiInstallationInfo } from '../../src/types/pi';

const execAsync = promisify(exec);

export class PiDetector {
  public static async detect(): Promise<PiInstallationInfo> {
    const packageManagers = await this.checkPackageManagers();
    
    // Check PATH and known locations
    const candidatePaths = await this.findCandidatePaths();
    
    let detectedExe = '';
    let version = '';
    let works = false;
    let installMethod: PiInstallationInfo['installationMethod'] = 'unknown';
    let rawOutput = '';

    for (const candidate of candidatePaths) {
      const testResult = await this.testExecutable(candidate);
      if (testResult.works) {
        detectedExe = candidate;
        version = testResult.version;
        works = true;
        rawOutput = testResult.output;
        
        if (candidate.toLowerCase().includes('npm') || candidate.toLowerCase().includes('node_modules')) {
          installMethod = 'npm-global';
        } else if (candidate.includes('.pi/agent/bin') || candidate.includes('.pi\\agent\\bin')) {
          installMethod = 'installer-script';
        } else {
          installMethod = 'npm-global';
        }
        break;
      }
    }

    // If candidate path test succeeded or didn't, also try running bare `pi` via shell
    if (!works) {
      const shellTest = await this.testExecutable('pi');
      if (shellTest.works) {
        detectedExe = 'pi';
        version = shellTest.version;
        works = true;
        rawOutput = shellTest.output;
        installMethod = 'npm-global';
      }
    }

    return {
      isInstalled: works,
      version: version || (works ? 'detected' : undefined),
      executablePath: detectedExe || undefined,
      installationMethod: works ? installMethod : undefined,
      works,
      output: rawOutput,
      packageManagers
    };
  }

  private static async checkPackageManagers() {
    const checkCmd = async (cmd: string): Promise<boolean> => {
      try {
        await execAsync(`${cmd} --version`);
        return true;
      } catch {
        return false;
      }
    };

    const [hasNpm, hasPnpm, hasYarn, hasBun, hasBrew] = await Promise.all([
      checkCmd('npm'),
      checkCmd('pnpm'),
      checkCmd('yarn'),
      checkCmd('bun'),
      os.platform() !== 'win32' ? checkCmd('brew') : Promise.resolve(false)
    ]);

    return {
      npm: hasNpm,
      pnpm: hasPnpm,
      yarn: hasYarn,
      bun: hasBun,
      brew: hasBrew
    };
  }

  private static async findCandidatePaths(): Promise<string[]> {
    const candidates: string[] = [];
    const isWin = os.platform() === 'win32';
    const home = os.homedir();

    // 1. Where/which command
    try {
      const lookupCmd = isWin ? 'where pi' : 'which pi';
      const { stdout } = await execAsync(lookupCmd);
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      candidates.push(...lines);
    } catch {
      // Ignore
    }

    // 2. npm global prefix
    try {
      const { stdout } = await execAsync('npm root -g');
      const npmRoot = stdout.trim();
      if (npmRoot) {
        if (isWin) {
          const npmBin = path.dirname(npmRoot);
          candidates.push(path.join(npmBin, 'pi.ps1'));
          candidates.push(path.join(npmBin, 'pi.cmd'));
          candidates.push(path.join(npmBin, 'pi'));
        } else {
          const npmBin = path.join(path.dirname(npmRoot), 'bin');
          candidates.push(path.join(npmBin, 'pi'));
        }
      }
    } catch {
      // Ignore
    }

    // 3. User directories
    if (isWin) {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      candidates.push(path.join(appData, 'npm', 'pi.ps1'));
      candidates.push(path.join(appData, 'npm', 'pi.cmd'));
      candidates.push(path.join(appData, 'npm', 'pi'));
      candidates.push(path.join(home, '.pi', 'agent', 'bin', 'pi.exe'));
    } else {
      candidates.push(path.join(home, '.pi', 'agent', 'bin', 'pi'));
      candidates.push(path.join(home, '.nvm', 'versions', 'node', process.version, 'bin', 'pi'));
      candidates.push('/usr/local/bin/pi');
      candidates.push('/opt/homebrew/bin/pi');
    }

    // Remove duplicates and filter existing files
    const unique = Array.from(new Set(candidates)).filter(p => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    return unique;
  }

  private static async testExecutable(exePath: string): Promise<{ works: boolean; version: string; output: string }> {
    return new Promise((resolve) => {
      const isWin = os.platform() === 'win32';
      let cmd = exePath;
      let args = ['--version'];

      // On Windows, if calling a .ps1 script directly, run via powershell
      if (isWin && exePath.endsWith('.ps1')) {
        cmd = 'powershell.exe';
        args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', exePath, '--version'];
      }

      const child = spawn(cmd, args, {
        shell: true,
        env: { ...process.env, PI_OFFLINE: '1' },
        timeout: 8000
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d) => stdout += d.toString());
      child.stderr?.on('data', (d) => stderr += d.toString());

      child.on('error', () => {
        resolve({ works: false, version: '', output: stderr });
      });

      child.on('close', (code) => {
        const fullOutput = (stdout + '\n' + stderr).trim();
        if (code === 0 && fullOutput) {
          // Look for semver pattern e.g. 0.85.1
          const match = fullOutput.match(/(\d+\.\d+\.\d+[\w.-]*)/);
          resolve({
            works: true,
            version: match ? match[1] : fullOutput.slice(0, 20),
            output: fullOutput
          });
        } else {
          resolve({ works: false, version: '', output: fullOutput });
        }
      });
    });
  }
}
