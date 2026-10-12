/*---------------------------------------------------------------------------------------------
 *  Dotwork. Explorer viewlet and file commands, with VS Code's command ids and keybindings.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../../../base/common/codicons.js';
import { KeyChord, KeyCode, KeyMod } from '../../../../base/common/keyCodes.js';
import { localize, localize2 } from '../../../../nls.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { Action2, MenuId, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { ContextKeyExpr } from '../../../../platform/contextkey/common/contextkey.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { ViewletRegistry } from '../../../browser/viewlet.js';
import { ActiveEditorContext, WorkspaceFolderCountContext } from '../../../common/contextkeys.js';
import { IEditorService } from '../../../services/editor/browser/editorService.js';
import { IViewletService } from '../../../services/viewlets/browser/viewletService.js';
import { IWorkspaceContextService } from '../../../services/workspace/browser/workspaceService.js';
import { IExplorerService } from './explorerService.js';
import { ExplorerView } from './explorerView.js';
import { EXPLORER_VIEWLET_ID, FileCommands } from './fileCommands.js';

const HasActiveEditor = ContextKeyExpr.notEquals(ActiveEditorContext.key, null);

ViewletRegistry.registerViewlet({
	id: EXPLORER_VIEWLET_ID,
	title: localize('explorer', "Explorer"),
	icon: Codicon.files,
	order: 0,
	ctor: ExplorerView
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: EXPLORER_VIEWLET_ID,
			title: localize2('showExplorer', "Show Explorer"),
			category: Categories.View,
			f1: true,
			keybinding: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyE, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarViewMenu, group: '1_open', order: 1 }
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IViewletService).openViewlet(EXPLORER_VIEWLET_ID);
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.openFolder,
			title: localize2('openFolder', "Open Folder..."),
			category: Categories.File,
			f1: true,
			keybinding: { primary: KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyO), weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarFileMenu, group: '2_open', order: 1 }
		});
	}
	run(accessor: ServicesAccessor): Promise<void> {
		return accessor.get(IWorkspaceContextService).openFolder();
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.save,
			title: localize2('save', "Save"),
			category: Categories.File,
			f1: true,
			precondition: HasActiveEditor,
			keybinding: { primary: KeyMod.CtrlCmd | KeyCode.KeyS, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarFileMenu, group: '4_save', order: 1 }
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const active = editorService.activeEditor;
		if (active) {
			await editorService.save(active.resource);
		}
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.saveAll,
			title: localize2('saveAll', "Save All"),
			category: Categories.File,
			f1: true,
			precondition: HasActiveEditor,
			keybinding: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyS, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarFileMenu, group: '4_save', order: 2 }
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		await accessor.get(IEditorService).saveAll();
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.closeActiveEditor,
			title: localize2('closeEditor', "Close Editor"),
			category: Categories.View,
			f1: true,
			precondition: HasActiveEditor,
			keybinding: { primary: KeyMod.CtrlCmd | KeyCode.KeyW, weight: KeybindingWeight.WorkbenchContrib },
			menu: { id: MenuId.MenubarFileMenu, group: '6_close', order: 1 }
		});
	}
	async run(accessor: ServicesAccessor): Promise<void> {
		const editorService = accessor.get(IEditorService);
		const active = editorService.activeEditor;
		if (active) {
			await editorService.closeEditor(active.resource);
		}
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.refreshExplorer,
			title: localize2('refreshExplorer', "Refresh Explorer"),
			category: Categories.File,
			icon: Codicon.refresh,
			f1: true,
			precondition: ContextKeyExpr.greater(WorkspaceFolderCountContext.key, 0)
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IExplorerService).refresh();
	}
});

registerAction2(class extends Action2 {
	constructor() {
		super({
			id: FileCommands.collapseExplorerFolders,
			title: localize2('collapseExplorerFolders', "Collapse Folders in Explorer"),
			category: Categories.View,
			icon: Codicon.collapseAll,
			f1: true,
			precondition: ContextKeyExpr.greater(WorkspaceFolderCountContext.key, 0)
		});
	}
	run(accessor: ServicesAccessor): void {
		accessor.get(IExplorerService).collapseAll();
	}
});
