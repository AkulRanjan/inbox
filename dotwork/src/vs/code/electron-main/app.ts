/*---------------------------------------------------------------------------------------------
 *  Dotwork. Owns the main-process services and the window, like VS Code's `CodeApplication`.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow, Menu } from 'electron';
import { Disposable } from '../../base/common/lifecycle.js';
import { isMacintosh } from '../../base/common/platform.js';
import { DiskFileSystemProviderServer } from '../../platform/files/electron-main/diskFileSystemProviderServer.js';
import { DiskFileSystemProvider } from '../../platform/files/node/diskFileSystemProvider.js';
import { NativeHostMainService } from '../../platform/native/electron-main/nativeHostMainService.js';
import { handleAppScheme } from '../../platform/protocol/electron-main/protocolMainService.js';
import { CodeWindow } from '../../platform/window/electron-main/window.js';

export class CodeApplication extends Disposable {

	private window: CodeWindow | undefined;

	startup(): void {
		app.setAppUserModelId('com.dotwork.app');

		// The workbench draws its own menubar. macOS keeps the native app menu for Copy/Paste/Quit.
		if (!isMacintosh) {
			Menu.setApplicationMenu(null);
		}

		// Nothing in the app may navigate or embed webviews; links go to the system browser.
		app.on('web-contents-created', (_event, contents) => {
			contents.on('will-navigate', e => e.preventDefault());
			contents.on('will-attach-webview', e => e.preventDefault());
		});

		handleAppScheme();

		const fileSystemProvider = new DiskFileSystemProvider();
		this._register(new DiskFileSystemProviderServer(fileSystemProvider));
		this._register(new NativeHostMainService(fileSystemProvider, event =>
			this.window && BrowserWindow.fromWebContents(event.sender) === this.window.win ? this.window : undefined
		));

		this.openWindow();
		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length === 0) {
				this.openWindow();
			}
		});
	}

	private openWindow(): void {
		this.window?.dispose();
		this.window = new CodeWindow();
	}
}
