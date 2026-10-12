/*---------------------------------------------------------------------------------------------
 *  Dotwork. One workbench window, modelled on VS Code's `CodeWindow`.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import { Disposable, toDisposable } from '../../../base/common/lifecycle.js';
import { NativeHostChannels } from '../../native/common/native.js';
import { APP_ORIGIN } from '../../protocol/common/protocol.js';

export interface ICodeWindow {
	readonly win: BrowserWindow;
	/** Closes the window; without `force` the workbench first gets to veto (unsaved changes). */
	close(options?: { force?: boolean; }): void;
}

const WORKBENCH_URL = `${APP_ORIGIN}/out/vs/code/electron-browser/workbench/workbench.html`;

export class CodeWindow extends Disposable implements ICodeWindow {

	readonly win: BrowserWindow;

	private forceClose = false;
	private quitRequested = false;

	constructor() {
		super();

		this.win = new BrowserWindow({
			width: 1200,
			height: 800,
			minWidth: 400,
			minHeight: 270,
			show: false,
			backgroundColor: '#181818',
			title: app.getName(),
			// Custom title bar; the native min/max/close buttons are drawn as an overlay.
			titleBarStyle: 'hidden',
			titleBarOverlay: { color: '#181818', symbolColor: '#cccccc', height: 35 },
			...(process.platform === 'linux' ? { icon: path.join(app.getAppPath(), 'resources/linux/code.png') } : {}),
			webPreferences: {
				preload: path.join(app.getAppPath(), 'out/vs/base/parts/sandbox/electron-browser/preload.js'),
				contextIsolation: true,
				sandbox: true,
				nodeIntegration: false,
				webSecurity: true,
				spellcheck: false
			}
		});

		this.win.once('ready-to-show', () => this.win.show());

		// Links open in the system browser, and only http(s) ones.
		this.win.webContents.setWindowOpenHandler(({ url }) => {
			if (/^https?:\/\//i.test(url)) {
				shell.openExternal(url);
			}

			return { action: 'deny' };
		});
		this.win.webContents.on('will-navigate', e => e.preventDefault());

		const onBeforeQuit = () => this.quitRequested = true;
		app.on('before-quit', onBeforeQuit);
		this._register(toDisposable(() => app.off('before-quit', onBeforeQuit)));

		// Let the workbench veto the close (unsaved editors). It answers through `closeWindow`.
		this.win.on('close', e => {
			if (this.forceClose || this.win.webContents.isLoading() || this.win.webContents.isCrashed()) {
				return;
			}

			e.preventDefault();
			this.win.webContents.send(NativeHostChannels.onBeforeShutdown);
		});

		// A hung renderer cannot answer, so do not let it trap the user.
		this.win.on('unresponsive', () => this.forceClose = true);
		this.win.on('responsive', () => this.forceClose = false);

		this.win.loadURL(WORKBENCH_URL);
	}

	close(options?: { force?: boolean; }): void {
		this.forceClose = options?.force ?? false;
		this.win.close();
		if (this.forceClose && this.quitRequested) {
			app.quit();
		}
	}
}
