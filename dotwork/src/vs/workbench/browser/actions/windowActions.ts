/*---------------------------------------------------------------------------------------------
 *  Dotwork. Window and developer commands, with VS Code's command ids.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../base/common/keyCodes.js';
import { localize2 } from '../../../nls.js';
import { Categories } from '../../../platform/action/common/actionCommonCategories.js';
import { Action2, MenuId, registerAction2 } from '../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../platform/keybinding/common/keybindingsRegistry.js';
import { INativeHostService } from '../../../platform/native/common/native.js';
import { IEditorService } from '../../services/editor/browser/editorService.js';

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.reloadWindow',
			title: localize2('reloadWindow', "Reload Window"),
			category: Categories.Developer,
			f1: true,
			menu: { id: MenuId.MenubarHelpMenu, group: '5_tools', order: 1 }
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const nativeHostService = accessor.get(INativeHostService);
		// A reload discards editor state, so unsaved changes get the usual prompt first.
		if (await editorService.confirmSaveAll()) {
			await nativeHostService.reload();
		}
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.toggleDevTools',
			title: localize2('toggleDevTools', "Toggle Developer Tools"),
			category: Categories.Developer,
			f1: true,
			keybinding: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyI, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarHelpMenu, group: '5_tools', order: 2 }
		});
	}
	run(accessor: ServicesAccessor): Promise<void> {
		return accessor.get(INativeHostService).toggleDevTools();
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: 'workbench.action.showAboutDialog',
			title: localize2('about', "About"),
			category: Categories.Help,
			f1: true,
			menu: { id: MenuId.MenubarHelpMenu, group: 'z_about', order: 1 }
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const nativeHostService = accessor.get(INativeHostService);
		const info = await nativeHostService.getProductInfo();
		await nativeHostService.showMessageBox({
			type: 'info',
			message: info.name,
			detail: `Version: ${info.version}\nElectron: ${info.electron}\nChromium: ${info.chrome}\nNode.js: ${info.node}`,
			buttons: ['OK']
		});
	}
});
