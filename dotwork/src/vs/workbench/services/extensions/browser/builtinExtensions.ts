import { APP_ORIGIN } from '../../../../platform/protocol/common/protocol.js';

/** The parts of an extension's package.json that the workbench reads today. */
export interface IExtensionManifest {
	name: string;
	contributes?: {
		languages?: Array<{
			id: string;
			aliases?: string[];
			extensions?: string[];
			filenames?: string[];
			filenamePatterns?: string[];
			firstLine?: string;
			configuration?: string;
		}>;
		grammars?: Array<{
			language?: string;
			scopeName: string;
			path: string;
			embeddedLanguages?: Record<string, string>;
			tokenTypes?: Record<string, string>;
			injectTo?: string[];
			balancedBracketScopes?: string[];
			unbalancedBracketScopes?: string[];
		}>;
		themes?: Array<{ id?: string; label?: string; uiTheme: string; path: string; }>;
	};
}

export interface IBuiltinExtension {
	/** Folder name under `extensions/`. */
	dir: string;
	manifest: IExtensionManifest;
}

/** URL of a file inside a built-in extension, e.g. `extensionResource(ext, './syntaxes/x.json')`. */
export function extensionResource(extension: IBuiltinExtension, relativePath: string): string {
	const clean = relativePath.replace(/^\.\//, '');
	return `${APP_ORIGIN}/extensions/${extension.dir}/${clean.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Built-in extensions ship in `extensions/` (VS Code's grammars, language settings and themes).
 * The build writes their manifests into one file, as VS Code does for its built-in extensions.
 */
export async function scanBuiltinExtensions(): Promise<IBuiltinExtension[]> {
	const response = await fetch(`${APP_ORIGIN}/out/builtin-extensions.json`);
	if (!response.ok) {
		throw new Error(`Could not load built-in extensions (${response.status})`);
	}
	return response.json();
}
