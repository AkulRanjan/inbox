/*---------------------------------------------------------------------------------------------
 *  Dotwork. File access for the workbench. VS Code's IFileService is URI and provider based;
 *  this is the small path-based subset Dotwork needs today.
 *--------------------------------------------------------------------------------------------*/

import { z } from 'zod';
import { createDecorator } from '../../instantiation/common/instantiation.js';

export interface IFileStat {
	readonly name: string;
	/** Absolute path on disk. */
	readonly resource: string;
	readonly isDirectory: boolean;
}

export type IReadFileResult =
	| { readonly kind: 'text'; readonly value: string; }
	| { readonly kind: 'binary'; }
	| { readonly kind: 'tooLarge'; readonly size: number; };

/** Files above this size are not opened in the text editor. */
export const MAX_TEXT_FILE_SIZE = 50 * 1024 * 1024;

export const FileChannels = {
	readdir: 'vscode:files.readdir',
	readFile: 'vscode:files.readFile',
	writeFile: 'vscode:files.writeFile'
} as const;

/** zod schemas for every payload crossing the process boundary; main validates all of them. */
export const ReaddirArgs = z.tuple([z.string().min(1)]);
export const ReadFileArgs = z.tuple([z.string().min(1)]);
export const WriteFileArgs = z.tuple([z.string().min(1), z.string()]);

export const IFileService = createDecorator<IFileService>('fileService');

export interface IFileService {
	readonly _serviceBrand: undefined;
	readdir(resource: string): Promise<IFileStat[]>;
	readFile(resource: string): Promise<IReadFileResult>;
	writeFile(resource: string, value: string): Promise<void>;
}
