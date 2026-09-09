import { BrowserWindow } from 'electron';
import { ExtensionUiRequest, ExtensionUiResponse } from '../../src/types/pi';
import { PiRpcProcess } from './pi-rpc-process';

export class PiUiBridge {
  private activeDialogs = new Map<string, {
    request: ExtensionUiRequest;
    timeoutTimer?: NodeJS.Timeout;
  }>();

  constructor(
    private getMainWindow: () => BrowserWindow | null,
    private rpcProcess: PiRpcProcess
  ) {
    this.setupListeners();
  }

  private setupListeners() {
    this.rpcProcess.on('extension_ui_request', (req: ExtensionUiRequest) => {
      this.handleIncomingRequest(req);
    });
  }

  private handleIncomingRequest(req: ExtensionUiRequest) {
    const win = this.getMainWindow();

    // Dialog methods require a response
    if (['select', 'confirm', 'input', 'editor'].includes(req.method)) {
      let timeoutTimer: NodeJS.Timeout | undefined;

      if (req.timeout && req.timeout > 0) {
        timeoutTimer = setTimeout(() => {
          this.resolveDialog(req.id, {
            type: 'extension_ui_response',
            id: req.id,
            cancelled: true
          });
        }, req.timeout);
      }

      this.activeDialogs.set(req.id, { request: req, timeoutTimer });

      if (win && !win.isDestroyed()) {
        win.webContents.send('pi:ui-dialog-request', req);
      }
    } else {
      // Fire-and-forget methods (notify, setStatus, setWidget, setTitle, set_editor_text)
      if (win && !win.isDestroyed()) {
        win.webContents.send('pi:ui-fire-and-forget', req);
      }
    }
  }

  public resolveDialog(id: string, response: ExtensionUiResponse) {
    const dialog = this.activeDialogs.get(id);
    if (!dialog) return;

    if (dialog.timeoutTimer) {
      clearTimeout(dialog.timeoutTimer);
    }
    this.activeDialogs.delete(id);

    this.rpcProcess.sendUiResponse(response);

    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('pi:ui-dialog-closed', { id });
    }
  }

  public cancelAll() {
    for (const [id, dialog] of this.activeDialogs.entries()) {
      if (dialog.timeoutTimer) clearTimeout(dialog.timeoutTimer);
      this.rpcProcess.sendUiResponse({
        type: 'extension_ui_response',
        id,
        cancelled: true
      });
    }
    this.activeDialogs.clear();
  }
}
