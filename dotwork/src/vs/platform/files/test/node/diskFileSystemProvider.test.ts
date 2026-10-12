import * as assert from 'assert';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DiskFileSystemProvider } from '../../node/diskFileSystemProvider.js';

suite('DiskFileSystemProvider', () => {
	let base: string;
	let root: string;
	let outside: string;
	let provider: DiskFileSystemProvider;

	setup(async () => {
		base = await fs.mkdtemp(path.join(os.tmpdir(), 'dotwork-fs-'));
		root = path.join(base, 'workspace');
		outside = path.join(base, 'outside');
		await fs.mkdir(path.join(root, 'src'), { recursive: true });
		await fs.mkdir(outside);
		await fs.writeFile(path.join(root, 'src', 'a.txt'), 'inside');
		await fs.writeFile(path.join(outside, 'secret.txt'), 'secret');
		provider = new DiskFileSystemProvider();
		await provider.setRoot(root);
	});

	teardown(async () => {
		await fs.rm(base, { recursive: true, force: true });
	});

	test('reads and writes files inside the workspace', async () => {
		const realRoot = provider.getRoot()!;
		assert.deepStrictEqual(await provider.readFile(path.join(realRoot, 'src', 'a.txt')), { kind: 'text', value: 'inside' });
		await provider.writeFile(path.join(realRoot, 'src', 'new.txt'), 'hello');
		assert.strictEqual(await fs.readFile(path.join(root, 'src', 'new.txt'), 'utf8'), 'hello');
	});

	test('lists folders first, then files, by name', async () => {
		const realRoot = provider.getRoot()!;
		await fs.writeFile(path.join(root, 'b.txt'), '');
		await fs.writeFile(path.join(root, 'A.txt'), '');
		const names = (await provider.readdir(realRoot)).map((s) => s.name);
		assert.deepStrictEqual(names, ['src', 'A.txt', 'b.txt']);
	});

	test('rejects `..` escapes', async () => {
		await assert.rejects(provider.readFile(path.join(root, '..', 'outside', 'secret.txt')), /outside the open folder/);
		await assert.rejects(provider.writeFile(path.join(root, '..', 'outside', 'x.txt'), 'x'), /outside the open folder/);
		await assert.rejects(provider.readdir(path.join(root, '..')), /outside the open folder/);
	});

	test('rejects reads and writes through a link that points outside', async function () {
		// A directory junction needs no special rights on Windows; elsewhere it is a symlink.
		const link = path.join(root, 'link');
		try {
			await fs.symlink(outside, link, 'junction');
		} catch {
			this.skip();
		}
		await assert.rejects(provider.readFile(path.join(link, 'secret.txt')), /outside the open folder/);
		await assert.rejects(provider.writeFile(path.join(link, 'new.txt'), 'x'), /outside the open folder/);
		await assert.rejects(provider.readdir(link), /outside the open folder/);
	});

	test('flags binary files instead of decoding them', async () => {
		const file = path.join(provider.getRoot()!, 'image.bin');
		await fs.writeFile(file, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]));
		assert.deepStrictEqual(await provider.readFile(file), { kind: 'binary' });
	});

	test('refuses all access before a folder is opened', async () => {
		await assert.rejects(new DiskFileSystemProvider().readFile(path.join(root, 'src', 'a.txt')), /No folder is open/);
	});
});
