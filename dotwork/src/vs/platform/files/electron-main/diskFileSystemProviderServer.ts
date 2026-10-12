/*---------------------------------------------------------------------------------------------
 *  Dotwork. Exposes the disk provider to the workbench over validated IPC.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../base/common/lifecycle.js';
import { handleValidated } from '../../ipc/electron-main/ipcMain.js';
import { FileChannels, ReaddirArgs, ReadFileArgs, WriteFileArgs } from '../common/files.js';
import { DiskFileSystemProvider } from '../node/diskFileSystemProvider.js';

export class DiskFileSystemProviderServer extends Disposable {

	constructor(provider: DiskFileSystemProvider) {
		super();

		this._register(handleValidated(FileChannels.readdir, ReaddirArgs, (_e, resource) => provider.readdir(resource)));
		this._register(handleValidated(FileChannels.readFile, ReadFileArgs, (_e, resource) => provider.readFile(resource)));
		this._register(handleValidated(FileChannels.writeFile, WriteFileArgs, (_e, resource, value) => provider.writeFile(resource, value)));
	}
}
