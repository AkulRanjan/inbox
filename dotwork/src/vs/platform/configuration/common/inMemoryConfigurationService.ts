/*---------------------------------------------------------------------------------------------
 *  Dotwork. A settings store held in memory, implementing VS Code's `IConfigurationService`
 *  interface so VS Code's services (e.g. the context key service) can run on it. VS Code's own
 *  implementation reads settings.json files; Dotwork has no settings files yet.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../base/common/event.js';
import { Disposable } from '../../../base/common/lifecycle.js';
import { ConfigurationTarget, IConfigurationChangeEvent, IConfigurationData, IConfigurationService, IConfigurationValue } from './configuration.js';

export class InMemoryConfigurationService extends Disposable implements IConfigurationService {

	declare readonly _serviceBrand: undefined;

	private readonly values = new Map<string, unknown>();

	private readonly _onDidChangeConfiguration = this._register(new Emitter<IConfigurationChangeEvent>());
	readonly onDidChangeConfiguration = this._onDidChangeConfiguration.event;

	getConfigurationData(): IConfigurationData | null {
		return null;
	}

	getValue<T>(arg1?: unknown): T {
		const section = typeof arg1 === 'string' ? arg1 : undefined;
		if (!section) {
			return Object.fromEntries(this.values) as T;
		}
		if (this.values.has(section)) {
			return this.values.get(section) as T;
		}

		// A section such as `editor` returns all keys below it.
		const prefix = `${section}.`;
		const children = [...this.values].filter(([key]) => key.startsWith(prefix));
		return (children.length ? Object.fromEntries(children.map(([key, value]) => [key.slice(prefix.length), value])) : undefined) as T;
	}

	async updateValue(key: string, value: unknown): Promise<void> {
		if (value === undefined) {
			this.values.delete(key);
		} else {
			this.values.set(key, value);
		}

		const affectedKeys = new Set([key]);
		this._onDidChangeConfiguration.fire({
			source: ConfigurationTarget.MEMORY,
			affectedKeys,
			change: { keys: [key], overrides: [] },
			affectsConfiguration: configuration => key === configuration || key.startsWith(`${configuration}.`)
		});
	}

	inspect<T>(key: string): IConfigurationValue<Readonly<T>> {
		const value = this.values.get(key) as T | undefined;
		return { value, memoryValue: value, memory: value === undefined ? undefined : { value } };
	}

	async reloadConfiguration(): Promise<void> { }

	keys() {
		return { default: [], policy: [], user: [], workspace: [], workspaceFolder: [], memory: [...this.values.keys()] };
	}
}
