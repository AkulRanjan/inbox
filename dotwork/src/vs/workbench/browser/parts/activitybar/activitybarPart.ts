/*---------------------------------------------------------------------------------------------
 *  Dotwork. The activity bar: one button per viewlet, as in VS Code.
 *--------------------------------------------------------------------------------------------*/

import { $, append, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { Part } from '../../part.js';
import { ViewletRegistry } from '../../viewlet.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IViewletService } from '../../../services/viewlets/browser/viewletService.js';

export class ActivitybarPart extends Part {

	private items!: HTMLElement;

	constructor(
		@IViewletService private readonly viewletService: IViewletService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IKeybindingService private readonly keybindingService: IKeybindingService
	) {
		super(Parts.ACTIVITYBAR_PART, 'activity-bar');
	}

	create(): void {
		this.items = append(this.element, $('div.activity-bar__group', { role: 'tablist' }));
		this.render();

		this._register(this.viewletService.onDidChangeActiveViewlet(() => this.render()));
		this._register(this.layoutService.onDidChangePartVisibility(() => this.render()));
	}

	private render(): void {
		const sidebarVisible = this.layoutService.isVisible(Parts.SIDEBAR_PART);
		reset(this.items, ...ViewletRegistry.getViewlets().map(viewlet => {
			const active = sidebarVisible && viewlet.id === this.viewletService.activeViewletId;
			const keybinding = this.keybindingService.lookupKeybinding(viewlet.id)?.getLabel();
			const button = $(`button.activity-bar__item${active ? '.activity-bar__item--active' : ''}`, {
				title: keybinding ? `${viewlet.title} (${keybinding})` : viewlet.title,
				role: 'tab',
				'aria-selected': String(active)
			}, renderIcon(viewlet.icon));
			button.onclick = () => this.viewletService.toggleViewlet(viewlet.id);
			return button;
		}));
	}
}
