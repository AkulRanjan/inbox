/*---------------------------------------------------------------------------------------------
 *  Dotwork. Electron main-process entry point (VS Code: `src/vs/code/electron-main/main.ts`).
 *--------------------------------------------------------------------------------------------*/

import { app } from 'electron';
import { isMacintosh } from '../../base/common/platform.js';
import { registerAppScheme } from '../../platform/protocol/electron-main/protocolMainService.js';
import { CodeApplication } from './app.js';

if (!app.requestSingleInstanceLock()) {
	app.quit();
} else {
	registerAppScheme();

	app.whenReady().then(() => new CodeApplication().startup());

	app.on('window-all-closed', () => {
		if (!isMacintosh) {
			app.quit();
		}
	});
}
