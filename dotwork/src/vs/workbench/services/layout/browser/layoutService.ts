import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';

export enum Parts {
	TITLEBAR_PART = 'workbench.parts.titlebar',
	ACTIVITYBAR_PART = 'workbench.parts.activitybar',
	SIDEBAR_PART = 'workbench.parts.sidebar',
	EDITOR_PART = 'workbench.parts.editor',
	PANEL_PART = 'workbench.parts.panel',
	AUXILIARYBAR_PART = 'workbench.parts.auxiliarybar',
	STATUSBAR_PART = 'workbench.parts.statusbar'
}

export interface IPartVisibilityChangeEvent {
	part: Parts;
	visible: boolean;
}

export const IWorkbenchLayoutService = createDecorator<IWorkbenchLayoutService>('layoutService');

export interface IWorkbenchLayoutService {
	readonly _serviceBrand: undefined;
	readonly onDidChangePartVisibility: Event<IPartVisibilityChangeEvent>;
	isVisible(part: Parts): boolean;
	setPartHidden(hidden: boolean, part: Parts): void;
	togglePart(part: Parts): void;
}

/** Which parts are shown. The workbench listens and updates its split views. */
export class LayoutService extends Disposable implements IWorkbenchLayoutService {
	declare readonly _serviceBrand: undefined;

	private readonly hidden = new Set<Parts>();

	private readonly _onDidChangePartVisibility = this._register(new Emitter<IPartVisibilityChangeEvent>());
	readonly onDidChangePartVisibility = this._onDidChangePartVisibility.event;

	isVisible(part: Parts): boolean {
		return !this.hidden.has(part);
	}

	setPartHidden(hidden: boolean, part: Parts): void {
		if (hidden === this.hidden.has(part)) {
			return;
		}
		if (hidden) {
			this.hidden.add(part);
		} else {
			this.hidden.delete(part);
		}
		this._onDidChangePartVisibility.fire({ part, visible: !hidden });
	}

	togglePart(part: Parts): void {
		this.setPartHidden(this.isVisible(part), part);
	}
}

registerSingleton(IWorkbenchLayoutService, LayoutService, InstantiationType.Delayed);
