/*---------------------------------------------------------------------------------------------
 *  Dotwork. A side bar view whose feature is not built yet; says so instead of faking controls.
 *--------------------------------------------------------------------------------------------*/

import { $, append } from '../../../../base/browser/dom.js';
import { IViewlet } from '../../viewlet.js';

export function placeholderViewlet(note: string): new () => IViewlet {
	return class PlaceholderViewlet implements IViewlet {
		render(container: HTMLElement): void {
			append(container, $('p.sidebar__note', undefined, note));
		}
		dispose(): void { }
	};
}
