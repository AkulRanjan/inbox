/*---------------------------------------------------------------------------------------------
 *  Dotwork. Renderer side of the file service; disk work and path checks happen in main.
 *--------------------------------------------------------------------------------------------*/

import { ipcRenderer } from '../../../base/parts/sandbox/electron-browser/globals.js';
import { InstantiationType, registerSingleton } from '../../instantiation/common/extensions.js';
import { FileChannels, IFileService, IFileStat, IReadFileResult } from '../common/files.js';

export class FileService implements IFileService {

	declare readonly _serviceBrand: undefined;

	readdir(resource: string): Promise<IFileStat[]> {
		return ipcRenderer.invoke(FileChannels.readdir, resource);
	}

	readFile(resource: string): Promise<IReadFileResult> {
		return ipcRenderer.invoke(FileChannels.readFile, resource);
	}

	writeFile(resource: string, value: string): Promise<void> {
		return ipcRenderer.invoke(FileChannels.writeFile, resource, value);
	}
}

registerSingleton(IFileService, FileService, InstantiationType.Delayed);
