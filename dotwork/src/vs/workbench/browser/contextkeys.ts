/*---------------------------------------------------------------------------------------------
 *  Dotwork. Keeps workbench context keys in sync with the services, like VS Code's
 *  `WorkbenchContextKeysHandler`.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../base/common/lifecycle.js';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey.js';
import { ActiveEditorContext, ActiveEditorDirtyContext, ActiveViewletContext, AuxiliaryBarVisibleContext, PanelVisibleContext, SideBarVisibleContext, WorkspaceFolderCountContext } from '../common/contextkeys.js';
import { IEditorService } from '../services/editor/browser/editorService.js';
import { IWorkbenchLayoutService, Parts } from '../services/layout/browser/layoutService.js';
import { IViewletService } from '../services/viewlets/browser/viewletService.js';
import { IWorkspaceContextService } from '../services/workspace/browser/workspaceService.js';

export class WorkbenchContextKeysHandler extends Disposable {

	constructor(
		@IContextKeyService contextKeyService: IContextKeyService,
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@IViewletService viewletService: IViewletService,
		@IEditorService editorService: IEditorService,
		@IWorkspaceContextService contextService: IWorkspaceContextService
	) {
		super();

		const sideBarVisible = SideBarVisibleContext.bindTo(contextKeyService);
		const panelVisible = PanelVisibleContext.bindTo(contextKeyService);
		const auxiliaryBarVisible = AuxiliaryBarVisibleContext.bindTo(contextKeyService);
		const activeViewlet = ActiveViewletContext.bindTo(contextKeyService);
		const activeEditor = ActiveEditorContext.bindTo(contextKeyService);
		const activeEditorDirty = ActiveEditorDirtyContext.bindTo(contextKeyService);
		const workspaceFolderCount = WorkspaceFolderCountContext.bindTo(contextKeyService);

		const updateLayout = () => {
			sideBarVisible.set(layoutService.isVisible(Parts.SIDEBAR_PART));
			panelVisible.set(layoutService.isVisible(Parts.PANEL_PART));
			auxiliaryBarVisible.set(layoutService.isVisible(Parts.AUXILIARYBAR_PART));
		};
		const updateEditor = () => {
			const active = editorService.activeEditor;
			activeEditor.set(active?.resource ?? null);
			activeEditorDirty.set(!!active && editorService.isDirty(active.resource));
		};

		updateLayout();
		updateEditor();
		activeViewlet.set(viewletService.activeViewletId);
		workspaceFolderCount.set(contextService.root ? 1 : 0);

		this._register(layoutService.onDidChangePartVisibility(updateLayout));
		this._register(viewletService.onDidChangeActiveViewlet(id => activeViewlet.set(id)));
		this._register(editorService.onDidChangeEditors(updateEditor));
		this._register(editorService.onDidChangeDirty(updateEditor));
		this._register(contextService.onDidChangeWorkspace(() => workspaceFolderCount.set(contextService.root ? 1 : 0)));
	}
}
