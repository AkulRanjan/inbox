import { ipcRenderer } from '../../../../base/parts/sandbox/electron-browser/globals.js';
import { Disposable, toDisposable } from '../../../../base/common/lifecycle.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { INativeHostService, NativeHostChannels } from '../../../../platform/native/common/native.js';
import { IEditorService } from '../../editor/browser/editorService.js';
import { ILifecycleService } from '../common/lifecycle.js';

/**
 * When the window is asked to close, main waits for the workbench: unsaved editors get a
 * Save / Don't Save / Cancel prompt, and only then is the window really closed.
 */
export class NativeLifecycleService extends Disposable implements ILifecycleService {
	declare readonly _serviceBrand: undefined;
	private shuttingDown = false;

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@INativeHostService private readonly nativeHostService: INativeHostService
	) {
		super();
		const listener = (): void => {
			this.onBeforeShutdown();
		};
		ipcRenderer.on(NativeHostChannels.onBeforeShutdown, listener);
		this._register(toDisposable(() => ipcRenderer.removeListener(NativeHostChannels.onBeforeShutdown, listener)));
	}

	private async onBeforeShutdown(): Promise<void> {
		if (this.shuttingDown) {
			return; // the save prompt is already showing
		}
		this.shuttingDown = true;
		try {
			if (await this.editorService.confirmSaveAll()) {
				await this.nativeHostService.closeWindow();
			}
		} finally {
			this.shuttingDown = false;
		}
	}
}

registerSingleton(ILifecycleService, NativeLifecycleService, InstantiationType.Eager);
