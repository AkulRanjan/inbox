/*---------------------------------------------------------------------------------------------
 *  Dotwork. Layout commands, with VS Code's command ids and default keybindings.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../base/common/keyCodes.js';
import { localize2 } from '../../../nls.js';
import { Categories } from '../../../platform/action/common/actionCommonCategories.js';
import { Action2, MenuId, registerAction2 } from '../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../platform/keybinding/common/keybindingsRegistry.js';
import { IWorkbenchLayoutService, Parts } from '../../services/layout/browser/layoutService.js';

export const LayoutCommands = {
	toggleSidebar: 'workbench.action.toggleSidebarVisibility',
	togglePanel: 'workbench.action.togglePanel',
	toggleAuxiliaryBar: 'workbench.action.toggleAuxiliaryBar'
} as const;

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LayoutCommands.toggleSidebar,
			title: localize2('toggleSidebar', "Toggle Primary Side Bar Visibility"),
			category: Categories.View,
			f1: true,
			keybinding: { primary: KeyMod.CtrlCmd | KeyCode.KeyB, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarViewMenu, group: '2_layout', order: 1 }
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IWorkbenchLayoutService).togglePart(Parts.SIDEBAR_PART);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LayoutCommands.togglePanel,
			title: localize2('togglePanel', "Toggle Panel Visibility"),
			category: Categories.View,
			f1: true,
			keybinding: { primary: KeyMod.CtrlCmd | KeyCode.KeyJ, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarViewMenu, group: '2_layout', order: 2 }
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IWorkbenchLayoutService).togglePart(Parts.PANEL_PART);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: LayoutCommands.toggleAuxiliaryBar,
			title: localize2('toggleAuxiliaryBar', "Toggle Secondary Side Bar Visibility"),
			category: Categories.View,
			f1: true,
			keybinding: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyB, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarViewMenu, group: '2_layout', order: 3 }
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IWorkbenchLayoutService).togglePart(Parts.AUXILIARYBAR_PART);
	}
});
