/*---------------------------------------------------------------------------------------------
 *  Dotwork. Context keys used in `when` clauses, named as in VS Code's
 *  `vs/workbench/common/contextkeys.ts` and `vs/editor/common/editorContextKeys.ts`.
 *--------------------------------------------------------------------------------------------*/

import { RawContextKey } from '../../platform/contextkey/common/contextkey.js';
import { localize } from '../../nls.js';

export const SideBarVisibleContext = new RawContextKey<boolean>('sideBarVisible', false, localize('sideBarVisible', "Whether the primary side bar is visible"));
export const PanelVisibleContext = new RawContextKey<boolean>('panelVisible', false, localize('panelVisible', "Whether the panel is visible"));
export const AuxiliaryBarVisibleContext = new RawContextKey<boolean>('auxiliaryBarVisible', false, localize('auxiliaryBarVisible', "Whether the secondary side bar is visible"));
export const ActiveViewletContext = new RawContextKey<string>('activeViewlet', '', localize('activeViewlet', "The identifier of the active viewlet"));
export const ActiveEditorContext = new RawContextKey<string | null>('activeEditor', null, localize('activeEditor', "The path of the active editor"));
export const ActiveEditorDirtyContext = new RawContextKey<boolean>('activeEditorIsDirty', false, localize('activeEditorIsDirty', "Whether the active editor has unsaved changes"));
export const WorkspaceFolderCountContext = new RawContextKey<number>('workspaceFolderCount', 0, localize('workspaceFolderCount', "The number of root folders in the workspace"));
export const EditorTextFocusContext = new RawContextKey<boolean>('editorTextFocus', false, localize('editorTextFocus', "Whether the editor text has focus"));
