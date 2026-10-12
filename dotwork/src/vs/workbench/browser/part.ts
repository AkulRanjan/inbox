/*---------------------------------------------------------------------------------------------
 *  Dotwork. A region of the workbench (title bar, side bar, editor, ...), modelled on VS Code's
 *  `Part`. Parts that sit in a split view are views of VS Code's `SplitView`.
 *--------------------------------------------------------------------------------------------*/

import { $ } from '../../base/browser/dom.js';
import { IView, LayoutPriority } from '../../base/browser/ui/splitview/splitview.js';
import { Event } from '../../base/common/event.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { Parts } from '../services/layout/browser/layoutService.js';

export abstract class Part extends Disposable implements IView<number> {

	readonly element: HTMLElement;
	readonly onDidChange = Event.None;

	minimumSize = 0;
	maximumSize = Number.POSITIVE_INFINITY;
	priority: LayoutPriority = LayoutPriority.Normal;

	/** Size along the split axis and across it, from the last `layout` call. */
	protected dimension = { size: 0, orthogonalSize: 0 };

	constructor(readonly id: Parts, className: string) {
		super();

		this.element = $('div.part', { id });
		this.element.classList.add(...className.split(' '));
	}

	/** Builds the part's DOM. Called once by the workbench. */
	abstract create(): void;

	/** Called by the split view with the size along its axis; `orthogonalSize` is the other axis. */
	layout(size: number, _offset: number, orthogonalSize: number | undefined): void {
		this.dimension = { size, orthogonalSize: orthogonalSize ?? 0 };
	}
}
