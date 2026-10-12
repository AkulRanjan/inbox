import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';

export const IExplorerService = createDecorator<IExplorerService>('explorerService');

/** Lets commands reach the explorer view without holding a reference to it. */
export interface IExplorerService {
	readonly _serviceBrand: undefined;
	readonly onDidRequestRefresh: Event<void>;
	readonly onDidRequestCollapseAll: Event<void>;
	refresh(): void;
	collapseAll(): void;
}

export class ExplorerService extends Disposable implements IExplorerService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidRequestRefresh = this._register(new Emitter<void>());
	readonly onDidRequestRefresh = this._onDidRequestRefresh.event;
	private readonly _onDidRequestCollapseAll = this._register(new Emitter<void>());
	readonly onDidRequestCollapseAll = this._onDidRequestCollapseAll.event;

	refresh(): void {
		this._onDidRequestRefresh.fire();
	}

	collapseAll(): void {
		this._onDidRequestCollapseAll.fire();
	}
}

registerSingleton(IExplorerService, ExplorerService, InstantiationType.Delayed);
