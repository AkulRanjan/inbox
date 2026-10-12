/*---------------------------------------------------------------------------------------------
 *  Dotwork. Sandboxed preload in the shape of VS Code's
 *  `vs/base/parts/sandbox/electron-browser/preload.ts`: the page gets one global, `vscode`,
 *  whose IPC only accepts `vscode:` channels and whose `process` is what
 *  `vs/base/common/platform` and `vs/base/common/process` read in a sandboxed renderer.
 *--------------------------------------------------------------------------------------------*/

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

function validateIPC(channel: string): true | never {
	if (!channel?.startsWith('vscode:')) {
		throw new Error(`Unsupported event IPC channel '${channel}'`);
	}

	return true;
}

type Listener = (event: IpcRendererEvent, ...args: unknown[]) => void;

const globals = {

	ipcRenderer: {

		invoke(channel: string, ...args: unknown[]): Promise<unknown> {
			validateIPC(channel);

			return ipcRenderer.invoke(channel, ...args);
		},

		on(channel: string, listener: Listener) {
			validateIPC(channel);

			ipcRenderer.on(channel, listener);

			return this;
		},

		removeListener(channel: string, listener: Listener) {
			validateIPC(channel);

			ipcRenderer.removeListener(channel, listener);

			return this;
		}
	},

	process: {
		get platform() { return process.platform; },
		get arch() { return process.arch; },
		get env() { return {}; },
		get versions() { return process.versions; },
		get type() { return 'renderer'; },
		cwd() { return '/'; }
	}
};

contextBridge.exposeInMainWorld('vscode', globals);
