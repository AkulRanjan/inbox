import js from '@eslint/js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import tseslint from 'typescript-eslint';

const NODE_BUILTINS = ['fs', 'path', 'os', 'child_process', 'url', 'node:*'];

/**
 * Files copied from VS Code (they start with Microsoft's copyright header) are linted upstream
 * with VS Code's own rules, so they are skipped here.
 */
const VSCODE_HEADER = /^\/\*-+\r?\n \* {2}Copyright \(c\) Microsoft Corporation/;
function walk(dir) {
	return readdirSync(dir).flatMap(name => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}
const vscodeSources = walk('src')
	.filter(f => f.endsWith('.ts') && VSCODE_HEADER.test(readFileSync(f, 'utf8')))
	.map(f => f.replace(/\\/g, '/'));

/**
 * VS Code's layering rules, enforced like its `code-layering` and `code-import-patterns` rules.
 *
 * Layers: base -> platform -> editor -> workbench -> code. A layer imports only from layers before it.
 * Environments: `common` runs everywhere, `browser` has no Node, `node` has no DOM, `electron-main`
 * is the main process, and `electron-browser` is the sandboxed renderer, which reaches main only
 * through IPC.
 */
const LAYERS = {
	base: ['**/platform/**', '**/editor/**', '**/workbench/**', '**/code/**'],
	platform: ['**/editor/**', '**/workbench/**', '**/code/**', 'monaco-editor*'],
	editor: ['**/workbench/**', '**/code/**'],
	workbench: ['**/code/**'],
	code: []
};

const ENVIRONMENTS = {
	common: ['**/browser/**', '**/node/**', '**/electron-main/**', '**/electron-browser/**', 'electron', ...NODE_BUILTINS],
	browser: ['**/node/**', '**/electron-main/**', '**/electron-browser/**', 'electron', ...NODE_BUILTINS],
	node: ['**/browser/**', '**/electron-main/**', '**/electron-browser/**', 'electron'],
	'electron-main': ['**/browser/**', '**/electron-browser/**'],
	'electron-browser': ['**/node/**', '**/electron-main/**', 'electron', ...NODE_BUILTINS]
};

function restrict(files, patterns) {
	return {
		files,
		rules: {
			'no-restricted-imports': ['error', { patterns: [{ group: patterns, message: 'Layering violation (see eslint.config.mjs).' }] }]
		}
	};
}

// ESLint applies the last matching config per rule, so each layer x environment pair gets one
// combined rule, listed after the layer-only rule it refines.
const layering = Object.entries(LAYERS).flatMap(([layer, layerPatterns]) => [
	restrict([`src/vs/${layer}/**`], layerPatterns),
	...Object.entries(ENVIRONMENTS).map(([env, envPatterns]) => restrict([`src/vs/${layer}/**/${env}/**`], [...layerPatterns, ...envPatterns]))
]);

export default tseslint.config(
	{ ignores: ['node_modules', 'out', 'dist', 'extensions', 'src/typings', ...vscodeSources] },
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		files: ['src/**/*.ts'],
		rules: {
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'semi': ['error', 'always'],
			'indent': ['error', 'tab', { SwitchCase: 1, ignoredNodes: ['ConditionalExpression', 'CallExpression > *', 'TemplateLiteral > *'] }]
		}
	},
	...layering,
	{
		// The preload is the one renderer file that may use Electron's renderer API.
		files: ['src/vs/base/parts/sandbox/electron-browser/preload.ts'],
		rules: { 'no-restricted-imports': 'off' }
	},
	{
		files: ['gulpfile.mjs', 'eslint.config.mjs', 'build/**/*.mjs'],
		languageOptions: { globals: { console: 'readonly', process: 'readonly' } }
	}
);
