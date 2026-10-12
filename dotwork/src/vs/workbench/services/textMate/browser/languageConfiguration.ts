import * as monaco from 'monaco-editor/editor/editor.api';

/**
 * Converts a VS Code `language-configuration.json` into Monaco's LanguageConfiguration: regex
 * strings become RegExps and array pairs become objects, as VS Code's own loader does.
 */

type RegExpLike = string | { pattern: string; flags?: string; } | undefined;

function toRegExp(value: RegExpLike): RegExp | undefined {
	if (!value) return undefined;
	const [pattern, flags] = typeof value === 'string' ? [value, ''] : [value.pattern, value.flags];
	try {
		return new RegExp(pattern, flags);
	} catch (err) {
		console.warn(`Invalid regular expression in language configuration: ${pattern}`, err);
		return undefined;
	}
}

type PairLike = [string, string] | { open: string; close: string; notIn?: string | string[]; };

function toPair(pair: PairLike): monaco.languages.IAutoClosingPairConditional {
	if (Array.isArray(pair)) {
		return { open: pair[0], close: pair[1] };
	}
	const notIn = typeof pair.notIn === 'string' ? [pair.notIn] : pair.notIn;
	return { open: pair.open, close: pair.close, notIn };
}

const INDENT_ACTIONS: Record<string, monaco.languages.IndentAction> = {
	none: monaco.languages.IndentAction.None,
	indent: monaco.languages.IndentAction.Indent,
	indentOutdent: monaco.languages.IndentAction.IndentOutdent,
	outdent: monaco.languages.IndentAction.Outdent
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toLanguageConfiguration(raw: any): monaco.languages.LanguageConfiguration {
	const config: monaco.languages.LanguageConfiguration = {
		comments: raw.comments,
		brackets: raw.brackets,
		colorizedBracketPairs: raw.colorizedBracketPairs,
		autoCloseBefore: raw.autoCloseBefore,
		wordPattern: toRegExp(raw.wordPattern),
		autoClosingPairs: raw.autoClosingPairs?.map(toPair),
		surroundingPairs: raw.surroundingPairs?.map(toPair)
	};

	if (raw.indentationRules) {
		const decrease = toRegExp(raw.indentationRules.decreaseIndentPattern);
		const increase = toRegExp(raw.indentationRules.increaseIndentPattern);
		if (decrease && increase) {
			config.indentationRules = {
				decreaseIndentPattern: decrease,
				increaseIndentPattern: increase,
				indentNextLinePattern: toRegExp(raw.indentationRules.indentNextLinePattern),
				unIndentedLinePattern: toRegExp(raw.indentationRules.unIndentedLinePattern)
			};
		}
	}

	if (raw.folding) {
		const start = toRegExp(raw.folding.markers?.start);
		const end = toRegExp(raw.folding.markers?.end);
		config.folding = {
			offSide: raw.folding.offSide,
			markers: start && end ? { start, end } : undefined
		};
	}

	if (Array.isArray(raw.onEnterRules)) {
		config.onEnterRules = raw.onEnterRules
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.map((rule: any): monaco.languages.OnEnterRule | undefined => {
				const beforeText = toRegExp(rule.beforeText);
				if (!beforeText) return undefined;
				return {
					beforeText,
					afterText: toRegExp(rule.afterText),
					previousLineText: toRegExp(rule.previousLineText),
					action: {
						indentAction: INDENT_ACTIONS[rule.action?.indent] ?? monaco.languages.IndentAction.None,
						appendText: rule.action?.appendText,
						removeText: rule.action?.removeText
					}
				};
			})
			.filter(Boolean);
	}

	return config;
}
