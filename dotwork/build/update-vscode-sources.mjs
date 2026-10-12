// Re-copies the VS Code source files listed in build/vscode-sources.txt from microsoft/vscode at a
// given commit (default: the one recorded in that file). Uses the GitHub CLI (`gh`).
//
//   node build/update-vscode-sources.mjs [commit]
//
// Pick the commit monaco-editor was built from (`vscodeRef` in its package.json) so the editor and
// the workbench share one VS Code version. Run typecheck and tests afterwards.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const LIST = 'build/vscode-sources.txt';
const text = readFileSync(LIST, 'utf8');
const recorded = /commit ([0-9a-f]{40})/.exec(text)?.[1];
const ref = process.argv[2] ?? recorded;
const files = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

for (const file of files) {
	const content = execFileSync('gh', ['api', `repos/microsoft/vscode/contents/${file}?ref=${ref}`, '-H', 'Accept: application/vnd.github.raw'], { maxBuffer: 1 << 26 });
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, content);
	console.log(`updated ${file}`);
}

if (ref !== recorded) {
	writeFileSync(LIST, text.replace(recorded, ref));
}
console.log(`${files.length} files at ${ref}`);
