/*---------------------------------------------------------------------------------------------
 *  Dotwork. Renderer entry point (VS Code: `src/vs/code/electron-browser/workbench/workbench.ts`).
 *--------------------------------------------------------------------------------------------*/

import '../../../editor/editor.all.js';
import '../../../workbench/browser/media/workbench.css';
import { APP_ORIGIN } from '../../../platform/protocol/common/protocol.js';
import { Workbench } from '../../../workbench/workbench.desktop.main.js';

interface IMonacoEnvironmentGlobal {
	MonacoEnvironment: { getWorker(): Worker; };
}

// Monaco runs tokenisation helpers and diff computation in a web worker, served from the app.
(globalThis as unknown as IMonacoEnvironmentGlobal).MonacoEnvironment = {
	getWorker: () => new Worker(`${APP_ORIGIN}/out/vs/editor/editor.worker.js`, { name: 'editorWorker' })
};

new Workbench(document.body).startup();
