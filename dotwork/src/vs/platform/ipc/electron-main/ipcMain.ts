/*---------------------------------------------------------------------------------------------
 *  Dotwork. Registers an `invoke` handler that only answers the workbench page and validates
 *  arguments with zod first. VS Code's `validatedIpcMain` makes the same sender check.
 *--------------------------------------------------------------------------------------------*/

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { ZodType } from 'zod';
import { IDisposable, toDisposable } from '../../../base/common/lifecycle.js';
import { APP_ORIGIN } from '../../protocol/common/protocol.js';

export function handleValidated<A extends unknown[], R>(channel: string, schema: ZodType<A>, handler: (event: IpcMainInvokeEvent, ...args: A) => Promise<R> | R): IDisposable {
	ipcMain.handle(channel, (event, ...rawArgs) => {
		const url = event.senderFrame?.url ?? '';
		if (!url.startsWith(`${APP_ORIGIN}/`)) {
			throw new Error(`Refusing IPC '${channel}' from untrusted sender ${url}`);
		}

		return handler(event, ...schema.parse(rawArgs));
	});

	return toDisposable(() => ipcMain.removeHandler(channel));
}
