/*---------------------------------------------------------------------------------------------
 *  Dotwork. The primary side bar shows the active viewlet. Each viewlet is created once and
 *  keeps its DOM while hidden.
 *--------------------------------------------------------------------------------------------*/

import { $, append, reset } from '../../../../base/browser/dom.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { Part } from '../../part.js';
import { IViewlet, ViewletRegistry } from '../../viewlet.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';
import { IViewletService } from '../../../services/viewlets/browser/viewletService.js';

export class SidebarPart extends Part {

	private title!: HTMLElement;
	private content!: HTMLElement;
	private readonly viewlets = new Map<string, { viewlet: IViewlet; element: HTMLElement; }>();

	constructor(
		@IViewletService private readonly viewletService: IViewletService,
		@IInstantiationService private readonly instantiationService: IInstantiationService
	) {
		super(Parts.SIDEBAR_PART, 'sidebar');

		this.minimumSize = 170;
		this.maximumSize = 800;
	}

	create(): void {
		this.title = $('span');
		this.content = $('div.sidebar__content');
		append(this.element, $('div.sidebar__title', undefined, this.title), this.content);

		this.showViewlet(this.viewletService.activeViewletId);
		this._register(this.viewletService.onDidChangeActiveViewlet(id => this.showViewlet(id)));
	}

	private showViewlet(id: string): void {
		const descriptor = ViewletRegistry.getViewlet(id);
		if (!descriptor) {
			return;
		}
		this.title.textContent = descriptor.title;

		let entry = this.viewlets.get(id);
		if (!entry) {
			const viewlet = this._register(this.instantiationService.createInstance(descriptor.ctor));
			const element = $('div.viewlet');
			viewlet.render(element);
			entry = { viewlet, element };
			this.viewlets.set(id, entry);
		}
		reset(this.content, entry.element);
	}
}
