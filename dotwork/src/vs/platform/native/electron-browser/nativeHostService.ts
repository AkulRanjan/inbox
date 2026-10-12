/*---------------------------------------------------------------------------------------------
 *  Dotwork. Renderer side of `INativeHostService`.
 *--------------------------------------------------------------------------------------------*/

import { ipcRenderer } from '../../../base/parts/sandbox/electron-browser/globals.js';
import { InstantiationType, registerSingleton } from '../../instantiation/common/extensions.js';
import { IMessageBoxOptions, INativeHostService, IProductInfo, NativeHostChannels } from '../common/native.js';

export class NativeHostService implements INativeHostService {

	declare readonly _serviceBrand: undefined;

	pickFolder(): Promise<string | undefined> {
		return ipcRenderer.invoke(NativeHostChannels.pickFolder);
	}

	showMessageBox(options: IMessageBoxOptions): Promise<{ response: number; }> {
		return ipcRenderer.invoke(NativeHostChannels.showMessageBox, options);
	}

	closeWindow(): Promise<void> {
		return ipcRenderer.invoke(NativeHostChannels.closeWindow);
	}

	reload(): Promise<void> {
		return ipcRenderer.invoke(NativeHostChannels.reload);
	}

	toggleDevTools(): Promise<void> {
		return ipcRenderer.invoke(NativeHostChannels.toggleDevTools);
	}

	getProductInfo(): Promise<IProductInfo> {
		return ipcRenderer.invoke(NativeHostChannels.getProductInfo);
	}
}

registerSingleton(INativeHostService, NativeHostService, InstantiationType.Delayed);
