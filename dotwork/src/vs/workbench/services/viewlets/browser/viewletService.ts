import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IWorkbenchLayoutService, Parts } from '../../layout/browser/layoutService.js';

export const IViewletService = createDecorator<IViewletService>('viewletService');

export interface IViewletService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeActiveViewlet: Event<string>;
	readonly activeViewletId: string;
	/** Shows the viewlet. Like VS Code's activity bar, opening the visible one hides the side bar. */
	toggleViewlet(id: string): void;
	/** Shows the viewlet without ever hiding the side bar (menus, keyboard shortcuts). */
	openViewlet(id: string): void;
}

export class ViewletService extends Disposable implements IViewletService {
	declare readonly _serviceBrand: undefined;

	private _activeViewletId = 'workbench.view.explorer';
	get activeViewletId(): string {
		return this._activeViewletId;
	}

	private readonly _onDidChangeActiveViewlet = this._register(new Emitter<string>());
	readonly onDidChangeActiveViewlet = this._onDidChangeActiveViewlet.event;

	constructor(@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService) {
		super();
	}

	toggleViewlet(id: string): void {
		if (id === this._activeViewletId && this.layoutService.isVisible(Parts.SIDEBAR_PART)) {
			this.layoutService.setPartHidden(true, Parts.SIDEBAR_PART);
			return;
		}
		this.openViewlet(id);
	}

	openViewlet(id: string): void {
		this.layoutService.setPartHidden(false, Parts.SIDEBAR_PART);
		if (id !== this._activeViewletId) {
			this._activeViewletId = id;
			this._onDidChangeActiveViewlet.fire(id);
		}
	}
}

registerSingleton(IViewletService, ViewletService, InstantiationType.Delayed);
