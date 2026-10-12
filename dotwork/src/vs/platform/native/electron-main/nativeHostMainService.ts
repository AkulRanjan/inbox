/*---------------------------------------------------------------------------------------------
 *  Dotwork. Main-process side of `INativeHostService`: dialogs and window control for the
 *  calling window.
 *--------------------------------------------------------------------------------------------*/

import { app, BrowserWindow, dialog, IpcMainInvokeEvent, OpenDialogOptions } from 'electron';
import { Disposable } from '../../../base/common/lifecycle.js';
import { DiskFileSystemProvider } from '../../files/node/diskFileSystemProvider.js';
import { handleValidated } from '../../ipc/electron-main/ipcMain.js';
import { ICodeWindow } from '../../window/electron-main/window.js';
import { MessageBoxArgs, NativeHostChannels, NoArgs } from '../common/native.js';

export class NativeHostMainService extends Disposable {

	constructor(
		private readonly fileSystemProvider: DiskFileSystemProvider,
		private readonly getWindow: (event: IpcMainInvokeEvent) => ICodeWindow | undefined
	) {
		super();

		this._register(handleValidated(NativeHostChannels.pickFolder, NoArgs, async event => {
			const win = BrowserWindow.fromWebContents(event.sender);
			const options: OpenDialogOptions = { properties: ['openDirectory'] };
			const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
			if (result.canceled || result.filePaths.length === 0) {
				return undefined;
			}

			return this.fileSystemProvider.setRoot(result.filePaths[0]);
		}));

		this._register(handleValidated(NativeHostChannels.showMessageBox, MessageBoxArgs, async (event, options) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			const result = win ? await dialog.showMessageBox(win, { noLink: true, ...options }) : await dialog.showMessageBox({ noLink: true, ...options });

			return { response: result.response };
		}));

		this._register(handleValidated(NativeHostChannels.closeWindow, NoArgs, event => this.getWindow(event)?.close({ force: true })));
		this._register(handleValidated(NativeHostChannels.reload, NoArgs, event => event.sender.reload()));
		this._register(handleValidated(NativeHostChannels.toggleDevTools, NoArgs, event => event.sender.toggleDevTools()));
		this._register(handleValidated(NativeHostChannels.getProductInfo, NoArgs, () => ({
			name: app.getName(),
			version: app.getVersion(),
			electron: process.versions.electron,
			chrome: process.versions.chrome,
			node: process.versions.node
		})));
	}
}
