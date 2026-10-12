// Formats Dotwork's own sources the way VS Code's hygiene task does: TypeScript's formatter with
// tabs and semicolons, plus `.js` suffixes on relative imports (VS Code's import convention).
// Files copied from VS Code (they start with Microsoft's copyright header) are left untouched.
//
//   node build/format.mjs          format in place
//   node build/format.mjs --check  list files that need formatting; exit 1 if any

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const check = process.argv.includes('--check');
const VSCODE_HEADER = /^\/\*-+\r?\n \* {2}Copyright \(c\) Microsoft Corporation/;

/** Settings from VS Code's build/lib/formatter.ts. */
const settings = {
	...ts.getDefaultFormatCodeSettings('\n'),
	indentSize: 4,
	tabSize: 4,
	convertTabsToSpaces: false,
	semicolons: ts.SemicolonPreference.Insert,
	insertSpaceAfterCommaDelimiter: true,
	insertSpaceAfterSemicolonInForStatements: true,
	insertSpaceBeforeAndAfterBinaryOperators: true,
	insertSpaceAfterKeywordsInControlFlowStatements: true,
	insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
	insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
	insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
	insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
	placeOpenBraceOnNewLineForFunctions: false,
	placeOpenBraceOnNewLineForControlBlocks: false
};

function walk(dir) {
	return readdirSync(dir).flatMap(name => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}

function addJsSuffixes(text) {
	return text.replace(/((?:from|import)\s+')(\.{1,2}\/[^']+?)(')/g, (match, before, spec, after) =>
		/\.(js|css|json)$/.test(spec) ? match : `${before}${spec}.js${after}`);
}

function format(fileName, text) {
	const host = {
		getCompilationSettings: () => ({}),
		getScriptFileNames: () => [fileName],
		getScriptVersion: () => '1',
		getScriptSnapshot: name => name === fileName ? ts.ScriptSnapshot.fromString(text) : undefined,
		getCurrentDirectory: () => '',
		getDefaultLibFileName: () => 'lib.d.ts',
		fileExists: name => name === fileName,
		readFile: name => name === fileName ? text : undefined
	};
	const service = ts.createLanguageService(host);
	const edits = service.getFormattingEditsForDocument(fileName, settings);
	let result = text;
	for (const edit of edits.sort((a, b) => b.span.start - a.span.start)) {
		result = result.slice(0, edit.span.start) + edit.newText + result.slice(edit.span.start + edit.span.length);
	}
	return result;
}

const changed = [];
for (const file of walk('src').filter(f => f.endsWith('.ts'))) {
	const original = readFileSync(file, 'utf8');
	if (VSCODE_HEADER.test(original)) {
		continue;
	}
	const formatted = format(file, addJsSuffixes(original));
	if (formatted !== original) {
		changed.push(file);
		if (!check) {
			writeFileSync(file, formatted);
		}
	}
}

console.log(check ? `${changed.length} file(s) need formatting` : `formatted ${changed.length} file(s)`);
changed.forEach(f => console.log(`  ${f}`));
if (check && changed.length) {
	process.exit(1);
}
