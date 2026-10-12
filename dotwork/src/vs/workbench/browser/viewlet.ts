/*---------------------------------------------------------------------------------------------
 *  Dotwork. Views shown in the side bar and picked from the activity bar. VS Code models these
 *  as view containers and pane composites; this is the minimal version.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from '../../base/common/lifecycle.js';
import { ThemeIcon } from '../../base/common/themables.js';

export interface IViewlet extends IDisposable {
	/** Renders into `container` once; the element is kept while the viewlet is hidden. */
	render(container: HTMLElement): void;
}

export interface IViewletDescriptor {
	/** Also the id of the command that opens it, so menus and tooltips find its keybinding. */
	readonly id: string;
	readonly title: string;
	readonly icon: ThemeIcon;
	readonly order: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly ctor: new (...services: any[]) => IViewlet;
}

class ViewletRegistryImpl {

	private readonly viewlets = new Map<string, IViewletDescriptor>();

	registerViewlet(descriptor: IViewletDescriptor): void {
		this.viewlets.set(descriptor.id, descriptor);
	}

	getViewlet(id: string): IViewletDescriptor | undefined {
		return this.viewlets.get(id);
	}

	getViewlets(): IViewletDescriptor[] {
		return [...this.viewlets.values()].sort((a, b) => a.order - b.order);
	}
}

export const ViewletRegistry = new ViewletRegistryImpl();
