import * as monaco from 'monaco-editor/editor/editor.api';
import { parse as parseJSONC } from 'jsonc-parser';
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import {
	IGrammar,
	INITIAL,
	IRawTheme,
	parseRawGrammar,
	Registry,
	StateStack
} from 'vscode-textmate';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { APP_ORIGIN } from '../../../../platform/protocol/common/protocol.js';
import {
	extensionResource,
	IBuiltinExtension,
	IExtensionManifest,
	scanBuiltinExtensions
} from '../../extensions/browser/builtinExtensions.js';
import { toLanguageConfiguration } from './languageConfiguration.js';

export const ITextMateService = createDecorator<ITextMateService>('textMateService');

export interface ITextMateService {
	readonly _serviceBrand: undefined;
	/** Resolves once languages, grammars and the colour theme are registered with Monaco. */
	readonly whenReady: Promise<void>;
}

export const DEFAULT_THEME_ID = 'Dark Modern';
export const MONACO_THEME_NAME = 'dotwork-dark-modern';

type GrammarContribution = NonNullable<NonNullable<IExtensionManifest['contributes']>['grammars']>[number];

interface IGrammarDefinition {
	extension: IBuiltinExtension;
	contribution: GrammarContribution;
}

const TOKEN_TYPES: Record<string, number> = { other: 0, comment: 1, string: 2, regex: 3 };

class TMState implements monaco.languages.IState {
	constructor(readonly ruleStack: StateStack) { }
	clone(): TMState {
		return new TMState(this.ruleStack.clone());
	}
	equals(other: monaco.languages.IState): boolean {
		return other instanceof TMState && other.ruleStack.equals(this.ruleStack);
	}
}

/**
 * Syntax highlighting the way VS Code does it: TextMate grammars from the built-in extensions,
 * run by `vscode-textmate` on the `vscode-oniguruma` regex engine, coloured by a VS Code theme.
 * Monaco's own Monarch tokenizers are not used.
 */
export class TextMateService implements ITextMateService {
	declare readonly _serviceBrand: undefined;
	readonly whenReady: Promise<void>;

	private readonly grammarsByScope = new Map<string, IGrammarDefinition>();
	private readonly scopeByLanguage = new Map<string, string>();
	private readonly injectionsByScope = new Map<string, string[]>();
	private registry: Registry | undefined;

	constructor() {
		this.whenReady = this.initialize().catch((err) => {
			console.error('[textmate] initialisation failed; editors fall back to plain text', err);
		});
	}

	private async initialize(): Promise<void> {
		const extensions = await scanBuiltinExtensions();
		await this.registerLanguages(extensions);
		this.collectGrammars(extensions);

		const wasm = await fetch(`${APP_ORIGIN}/out/media/onig.wasm`).then((r) => r.arrayBuffer());
		await loadWASM(wasm);
		this.registry = new Registry({
			onigLib: Promise.resolve({ createOnigScanner, createOnigString }),
			loadGrammar: (scopeName) => this.loadRawGrammar(scopeName),
			getInjections: (scopeName) => this.injectionsByScope.get(scopeName)
		});

		await this.applyTheme(extensions);

		for (const [languageId, scopeName] of this.scopeByLanguage) {
			monaco.languages.registerTokensProviderFactory(languageId, {
				create: () => this.createTokensProvider(languageId, scopeName)
			});
		}
	}

	private async registerLanguages(extensions: IBuiltinExtension[]): Promise<void> {
		// Several extensions may contribute to the same language id; merge them like VS Code does.
		const languages = new Map<string, monaco.languages.ILanguageExtensionPoint>();
		const configurations = new Map<string, string>();
		for (const extension of extensions) {
			for (const lang of extension.manifest.contributes?.languages ?? []) {
				const existing = languages.get(lang.id) ?? { id: lang.id };
				const merge = (a?: string[], b?: string[]): string[] | undefined =>
					a || b ? [...new Set([...(a ?? []), ...(b ?? [])])] : undefined;
				languages.set(lang.id, {
					id: lang.id,
					extensions: merge(existing.extensions, lang.extensions),
					filenames: merge(existing.filenames, lang.filenames),
					filenamePatterns: merge(existing.filenamePatterns, lang.filenamePatterns),
					aliases: merge(existing.aliases, lang.aliases),
					firstLine: existing.firstLine ?? lang.firstLine
				});
				if (lang.configuration && !configurations.has(lang.id)) {
					configurations.set(lang.id, extensionResource(extension, lang.configuration));
				}
			}
		}

		for (const language of languages.values()) {
			monaco.languages.register(language);
		}
		await Promise.all(
			[...configurations].map(async ([languageId, url]) => {
				try {
					const raw = parseJSONC(await (await fetch(url)).text());
					monaco.languages.setLanguageConfiguration(languageId, toLanguageConfiguration(raw));
				} catch (err) {
					console.warn(`[textmate] could not load language configuration for ${languageId}`, err);
				}
			})
		);
	}

	private collectGrammars(extensions: IBuiltinExtension[]): void {
		for (const extension of extensions) {
			for (const contribution of extension.manifest.contributes?.grammars ?? []) {
				this.grammarsByScope.set(contribution.scopeName, { extension, contribution });
				if (contribution.language) {
					this.scopeByLanguage.set(contribution.language, contribution.scopeName);
				}
				for (const target of contribution.injectTo ?? []) {
					this.injectionsByScope.set(target, [
						...(this.injectionsByScope.get(target) ?? []),
						contribution.scopeName
					]);
				}
			}
		}
	}

	private async loadRawGrammar(scopeName: string): Promise<ReturnType<typeof parseRawGrammar> | null> {
		const definition = this.grammarsByScope.get(scopeName);
		if (!definition) {
			return null; // e.g. a language embedded in Markdown that has no built-in grammar
		}
		const url = extensionResource(definition.extension, definition.contribution.path);
		const content = await (await fetch(url)).text();
		return parseRawGrammar(content, definition.contribution.path);
	}

	private async createTokensProvider(
		languageId: string,
		scopeName: string
	): Promise<monaco.languages.EncodedTokensProvider> {
		const definition = this.grammarsByScope.get(scopeName)!;
		const registered = new Set(monaco.languages.getLanguages().map((l) => l.id));

		const embeddedLanguages: Record<string, number> = {};
		for (const [scope, id] of Object.entries(definition.contribution.embeddedLanguages ?? {})) {
			if (registered.has(id)) {
				embeddedLanguages[scope] = monaco.languages.getEncodedLanguageId(id);
			}
		}
		const tokenTypes: Record<string, number> = {};
		for (const [scope, type] of Object.entries(definition.contribution.tokenTypes ?? {})) {
			tokenTypes[scope] = TOKEN_TYPES[type] ?? 0;
		}

		const grammar: IGrammar | null = await this.registry!.loadGrammarWithConfiguration(
			scopeName,
			monaco.languages.getEncodedLanguageId(languageId),
			{
				embeddedLanguages,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				tokenTypes: tokenTypes as any,
				balancedBracketSelectors: definition.contribution.balancedBracketScopes ?? ['*'],
				unbalancedBracketSelectors: definition.contribution.unbalancedBracketScopes ?? []
			}
		);
		if (!grammar) {
			throw new Error(`No grammar for ${scopeName}`);
		}

		return {
			getInitialState: () => new TMState(INITIAL),
			tokenizeEncoded: (line, state) => {
				const result = grammar.tokenizeLine2(line, (state as TMState).ruleStack, 500);
				return { tokens: result.tokens, endState: new TMState(result.ruleStack) };
			}
		};
	}

	/** Loads the VS Code theme (following its `include` chain) and hands its colours to Monaco. */
	private async applyTheme(extensions: IBuiltinExtension[]): Promise<void> {
		let source: { extension: IBuiltinExtension; path: string; } | undefined;
		for (const extension of extensions) {
			const theme = extension.manifest.contributes?.themes?.find(
				(t) => (t.id ?? t.label) === DEFAULT_THEME_ID
			);
			if (theme) {
				source = { extension, path: theme.path };
			}
		}
		if (!source) {
			console.warn(`[textmate] theme '${DEFAULT_THEME_ID}' not found`);
			return;
		}

		const colors: Record<string, string> = {};
		const tokenColors: IRawTheme['settings'] = [];
		const load = async (path: string): Promise<void> => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const theme: any = parseJSONC(await (await fetch(extensionResource(source!.extension, path))).text());
			if (typeof theme.include === 'string') {
				const base = path.slice(0, path.lastIndexOf('/') + 1);
				await load(base + theme.include.replace(/^\.\//, ''));
			}
			Object.assign(colors, theme.colors ?? {});
			if (Array.isArray(theme.tokenColors)) {
				tokenColors.push(...theme.tokenColors);
			}
		};
		await load(source.path);

		const rawTheme: IRawTheme = {
			name: DEFAULT_THEME_ID,
			settings: [
				{ settings: { foreground: colors['editor.foreground'], background: colors['editor.background'] } },
				...tokenColors
			]
		};
		this.registry!.setTheme(rawTheme);

		// Publish workbench colours the way VS Code does: `editor.background` -> `--vscode-editor-background`.
		const rootStyle = document.documentElement.style;
		for (const [id, value] of Object.entries(colors)) {
			rootStyle.setProperty(`--vscode-${id.replace(/\./g, '-')}`, value);
		}

		monaco.editor.defineTheme(MONACO_THEME_NAME, {
			base: 'vs-dark',
			inherit: true,
			rules: [],
			colors
		});
		monaco.editor.setTheme(MONACO_THEME_NAME);
		monaco.languages.setColorMap(this.registry!.getColorMap());
	}
}

registerSingleton(ITextMateService, TextMateService, InstantiationType.Eager);
