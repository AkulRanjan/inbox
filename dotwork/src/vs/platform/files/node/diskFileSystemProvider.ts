/*---------------------------------------------------------------------------------------------
 *  Dotwork. Disk access for the open workspace. Every path is resolved with `realpath` before
 *  use, so `..` segments, symlinks and Windows junctions cannot reach outside the folder.
 *--------------------------------------------------------------------------------------------*/

import { promises as fs } from 'fs';
import * as path from 'path';
import { isEqualOrParent } from '../../../base/common/extpath.js';
import { isLinux } from '../../../base/common/platform.js';
import { IFileStat, IReadFileResult, MAX_TEXT_FILE_SIZE } from '../common/files.js';

export class FileAccessError extends Error { }

export class DiskFileSystemProvider {

	private root: string | undefined;

	/** Sets the workspace root and returns its canonical (real) path. */
	async setRoot(folder: string): Promise<string> {
		this.root = await fs.realpath(folder);

		return this.root;
	}

	getRoot(): string | undefined {
		return this.root;
	}

	async readdir(resource: string): Promise<IFileStat[]> {
		const dir = await this.resolve(resource, true);
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const stats = await Promise.all(entries.map(async entry => {
			let isDirectory = entry.isDirectory();
			if (entry.isSymbolicLink()) {
				// Show a link by what it points to; reading through it is still checked later.
				isDirectory = await fs.stat(path.join(dir, entry.name)).then(s => s.isDirectory(), () => false);
			}

			return { name: entry.name, resource: path.join(dir, entry.name), isDirectory };
		}));

		return stats.sort((a, b) => a.isDirectory !== b.isDirectory ? (a.isDirectory ? -1 : 1) : a.name.localeCompare(b.name));
	}

	async readFile(resource: string): Promise<IReadFileResult> {
		const file = await this.resolve(resource, true);
		const { size } = await fs.stat(file);
		if (size > MAX_TEXT_FILE_SIZE) {
			return { kind: 'tooLarge', size };
		}

		const buffer = await fs.readFile(file);
		// Same heuristic as VS Code: a NUL byte in the first 512 bytes means binary.
		if (buffer.subarray(0, 512).includes(0)) {
			return { kind: 'binary' };
		}

		return { kind: 'text', value: buffer.toString('utf8') };
	}

	async writeFile(resource: string, value: string): Promise<void> {
		const file = await this.resolve(resource, false);
		await fs.writeFile(file, value, 'utf8');
	}

	/**
	 * Canonicalises `resource` and checks that it is inside the root. A file that does not exist
	 * yet (`mustExist: false`) is checked through its parent folder.
	 */
	private async resolve(resource: string, mustExist: boolean): Promise<string> {
		if (!this.root) {
			throw new FileAccessError('No folder is open');
		}

		const absolute = path.resolve(resource);
		let real: string;
		try {
			real = await fs.realpath(absolute);
		} catch (error) {
			if (mustExist || error.code !== 'ENOENT') {
				throw error;
			}
			real = path.join(await fs.realpath(path.dirname(absolute)), path.basename(absolute));
		}

		if (!isEqualOrParent(real, this.root, !isLinux /* ignore case on Windows and macOS */)) {
			throw new FileAccessError(`Path is outside the open folder: ${resource}`);
		}

		return real;
	}
}
