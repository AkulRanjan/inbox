/*---------------------------------------------------------------------------------------------
 *  Dotwork. The bottom panel. Its views are placeholders until the terminal lands (plan, Day 8).
 *--------------------------------------------------------------------------------------------*/

import { $, append, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { LayoutPriority } from '../../../../base/browser/ui/splitview/splitview.js';
import { Part } from '../../part.js';
import { LayoutCommands } from '../../actions/layoutActions.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';

const TABS: { readonly title: string; readonly note: string; }[] = [
	{ title: localize('problems', "Problems"), note: localize('noProblems', "No problems have been detected in the workspace.") },
	{ title: localize('output', "Output"), note: localize('noOutput', "Nothing to show yet.") },
	{ title: localize('terminal', "Terminal"), note: localize('noTerminal', "Integrated terminal (xterm.js + node-pty) is not wired up yet.") }
];

export class PanelPart extends Part {

	private active = TABS[2].title;
	private tabs!: HTMLElement;
	private body!: HTMLElement;

	constructor(@ICommandService private readonly commandService: ICommandService) {
		super(Parts.PANEL_PART, 'bottom-panel');

		this.minimumSize = 77;
		this.priority = LayoutPriority.Low;
	}

	create(): void {
		this.tabs = $('div.bottom-panel__tabs', { role: 'tablist' });
		this.body = $('div.bottom-panel__body');
		append(this.element, this.tabs, this.body);
		this.render();
	}

	private render(): void {
		const close = $('button', { title: localize('hidePanel', "Hide Panel") }, renderIcon(Codicon.close));
		close.onclick = () => this.commandService.executeCommand(LayoutCommands.togglePanel);

		reset(this.tabs,
			...TABS.map(({ title }) => {
				const tab = $(`button.bottom-panel__tab${title === this.active ? '.bottom-panel__tab--active' : ''}`, { role: 'tab', 'aria-selected': String(title === this.active) }, title);
				tab.onclick = () => {
					this.active = title;
					this.render();
				};
				return tab;
			}),
			$('span.bottom-panel__spacer'),
			close
		);

		reset(this.body, $('p.dim.pad', undefined, TABS.find(t => t.title === this.active)!.note));
	}
}
