/*---------------------------------------------------------------------------------------------
 *  Dotwork. Typed access to the `vscode` global exposed by the preload script, like VS Code's
 *  `vs/base/parts/sandbox/electron-browser/globals.ts`.
 *--------------------------------------------------------------------------------------------*/

import { INodeProcess } from '../../../common/platform.js';

export interface IpcRenderer {
	invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
	on(channel: string, listener: (event: unknown, ...args: unknown[]) => void): this;
	removeListener(channel: string, listener: (event: unknown, ...args: unknown[]) => void): this;
}

interface ISandboxGlobals {
	readonly ipcRenderer: IpcRenderer;
	readonly process: INodeProcess;
}

const vscodeGlobal = (globalThis as unknown as { vscode: ISandboxGlobals; }).vscode;

export const ipcRenderer: IpcRenderer = vscodeGlobal.ipcRenderer;
export const process: INodeProcess = vscodeGlobal.process;
