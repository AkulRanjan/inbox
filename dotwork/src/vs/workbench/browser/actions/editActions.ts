/*---------------------------------------------------------------------------------------------
 *  Dotwork. Edit menu entries. As in VS Code, the editor and text fields handle the keys
 *  themselves; the menu runs the same operation on whatever has focus.
 *--------------------------------------------------------------------------------------------*/

import { KeyCode, KeyMod } from '../../../base/common/keyCodes.js';
import { localize2 } from '../../../nls.js';
import { Action2, MenuId, registerAction2 } from '../../../platform/actions/common/actions.js';
import { ServicesAccessor } from '../../../platform/instantiation/common/instantiation.js';
import { KeybindingWeight } from '../../../platform/keybinding/common/keybindingsRegistry.js';
import { IEditorService } from '../../services/editor/browser/editorService.js';

function registerEditCommand(id: string, title: string, editorAction: string, domCommand: string, primary: number, menu: MenuId, order: number): void {
	registerAction2(class extends Action2 {
		constructor() {
			super({
				id,
				title: localize2(id, title),
				keybinding: { primary, weight: KeybindingWeight.EditorCore },
				menu: { id: menu, group: '1_do', order }
			});
		}
		run(accessor: ServicesAccessor): void {
			const editor = accessor.get(IEditorService).activeCodeEditor;
			if (editor?.hasTextFocus()) {
				editor.trigger('menu', editorAction, null);
			} else {
				document.execCommand(domCommand);
			}
		}
	});
}

registerEditCommand('undo', "Undo", 'undo', 'undo', KeyMod.CtrlCmd | KeyCode.KeyZ, MenuId.MenubarEditMenu, 1);
registerEditCommand('redo', "Redo", 'redo', 'redo', KeyMod.CtrlCmd | KeyCode.KeyY, MenuId.MenubarEditMenu, 2);
registerEditCommand('editor.action.selectAll', "Select All", 'editor.action.selectAll', 'selectAll', KeyMod.CtrlCmd | KeyCode.KeyA, MenuId.MenubarSelectionMenu, 1);
