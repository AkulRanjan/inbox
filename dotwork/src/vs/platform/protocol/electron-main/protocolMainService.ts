/*---------------------------------------------------------------------------------------------
 *  Dotwork. Serves the application folder (and nothing else) on `dotwork-file://dotwork-app/`,
 *  like VS Code's `ProtocolMainService` does for `vscode-file://vscode-app/`.
 *--------------------------------------------------------------------------------------------*/

import { app, net, protocol } from 'electron';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { isEqualOrParent } from '../../../base/common/extpath.js';
import { isLinux } from '../../../base/common/platform.js';
import { APP_HOST, APP_SCHEME } from '../common/protocol.js';

/** Must run before `app.whenReady()`. */
export function registerAppScheme(): void {
	protocol.registerSchemesAsPrivileged([{
		scheme: APP_SCHEME,
		privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true }
	}]);
}

export function handleAppScheme(): void {
	const appRoot = app.getAppPath();
	protocol.handle(APP_SCHEME, request => {
		const url = new URL(request.url);
		const target = path.normalize(path.join(appRoot, decodeURIComponent(url.pathname)));
		if (url.host !== APP_HOST || !isEqualOrParent(target, appRoot, !isLinux)) {
			return new Response('Not found', { status: 404 });
		}

		return net.fetch(pathToFileURL(target).toString());
	});
}
