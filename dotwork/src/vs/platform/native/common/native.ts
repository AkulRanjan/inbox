/*---------------------------------------------------------------------------------------------
 *  Dotwork. Window and OS dialog access for the workbench, named after VS Code's
 *  `INativeHostService` (a small subset of it).
 *--------------------------------------------------------------------------------------------*/

import { z } from 'zod';
import { createDecorator } from '../../instantiation/common/instantiation.js';

export const NativeHostChannels = {
	pickFolder: 'vscode:nativeHost.pickFolder',
	showMessageBox: 'vscode:nativeHost.showMessageBox',
	closeWindow: 'vscode:nativeHost.closeWindow',
	reload: 'vscode:nativeHost.reload',
	toggleDevTools: 'vscode:nativeHost.toggleDevTools',
	getProductInfo: 'vscode:nativeHost.getProductInfo',
	/** main -> renderer: the window wants to close; the renderer answers with `closeWindow`. */
	onBeforeShutdown: 'vscode:lifecycle.onBeforeShutdown'
} as const;

export const MessageBoxOptionsSchema = z.object({
	type: z.enum(['none', 'info', 'error', 'question', 'warning']).optional(),
	message: z.string(),
	detail: z.string().optional(),
	buttons: z.array(z.string()).min(1).max(4),
	defaultId: z.number().int().optional(),
	cancelId: z.number().int().optional()
});
export type IMessageBoxOptions = z.infer<typeof MessageBoxOptionsSchema>;

export const NoArgs = z.tuple([]);
export const MessageBoxArgs = z.tuple([MessageBoxOptionsSchema]);

export interface IProductInfo {
	readonly name: string;
	readonly version: string;
	readonly electron: string;
	readonly chrome: string;
	readonly node: string;
}

export const INativeHostService = createDecorator<INativeHostService>('nativeHostService');

export interface INativeHostService {
	readonly _serviceBrand: undefined;
	/** Shows the OS folder picker; the chosen folder becomes the workspace root in main. */
	pickFolder(): Promise<string | undefined>;
	showMessageBox(options: IMessageBoxOptions): Promise<{ response: number; }>;
	closeWindow(): Promise<void>;
	reload(): Promise<void>;
	toggleDevTools(): Promise<void>;
	getProductInfo(): Promise<IProductInfo>;
}
