/*---------------------------------------------------------------------------------------------
 *  Dotwork. Side bar views that are planned but not built yet. Each moves into its own contrib
 *  folder (search, scm, dots) when its plan day arrives. Ids and keybindings follow VS Code.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize, localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { placeholderViewlet } from '../../../browser/parts/sidebar/placeholderViewlet.js';
import { ViewletRegistry } from '../../../browser/viewlet.js';
import { IViewletService } from '../../../services/viewlets/browser/viewletService.js';

interface IPlaceholder {
	readonly id: string;
	readonly title: string;
	readonly icon: ThemeIcon;
	readonly order: number;
	readonly primary?: number;
	readonly note: string;
}

const PLACEHOLDERS: IPlaceholder[] = [
	{ id: 'workbench.view.search', title: localize('search', "Search"), icon: Codicon.search, order: 1, primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF, note: localize('searchNote', "Project-wide ripgrep search is not wired up yet.") },
	{ id: 'workbench.view.scm', title: localize('scm', "Source Control"), icon: Codicon.sourceControl, order: 2, primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyG, note: localize('scmNote', "Status, stage and diff view are not wired up yet.") },
	{ id: 'workbench.view.dots', title: localize('dots', "Dots"), icon: Codicon.circleLargeFilled, order: 3, note: localize('dotsNote', "Listing and creating dots, with live status, is not wired up yet.") },
	{ id: 'workbench.view.dotInbox', title: localize('dotInbox', "Dot Inbox"), icon: Codicon.inbox, order: 4, note: localize('dotInboxNote', "Reviewing proposals from dots is not wired up yet.") }
];

for (const placeholder of PLACEHOLDERS) {
	ViewletRegistry.registerViewlet({ id: placeholder.id, title: placeholder.title, icon: placeholder.icon, order: placeholder.order, ctor: placeholderViewlet(placeholder.note) });

	registerAction2(class extends Action2 {
		constructor() {
			super({
				id: placeholder.id,
				title: localize2('showView', "Show {0}", placeholder.title),
				category: Categories.View,
				f1: true,
				keybinding: placeholder.primary ? { primary: placeholder.primary, weight: KeybindingWeight.WorkbenchContrib } : undefined,
				menu: { id: MenuId.MenubarViewMenu, group: '1_open', order: placeholder.order + 1 }
			});
		}
		run(accessor: ServicesAccessor): void {
			accessor.get(IViewletService).openViewlet(placeholder.id);
		}
	});
}
