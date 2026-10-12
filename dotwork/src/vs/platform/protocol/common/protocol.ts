/*---------------------------------------------------------------------------------------------
 *  Dotwork. The workbench is served from a private, privileged scheme, as VS Code serves
 *  `vscode-file://vscode-app/...`, so the CSP's `'self'`, web workers and `fetch` work and no
 *  other disk files are reachable.
 *--------------------------------------------------------------------------------------------*/

export const APP_SCHEME = 'dotwork-file';
export const APP_HOST = 'dotwork-app';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
