import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { INativeHostService } from '../../../../platform/native/common/native.js';
import { IEditorService } from '../../editor/browser/editorService.js';

export const IWorkspaceContextService = createDecorator<IWorkspaceContextService>('contextService');

export interface IWorkspaceContextService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeWorkspace: Event<void>;
	/** Absolute path of the open folder. */
	readonly root: string | undefined;
	/** Asks for a folder and opens it, after closing editors (with a save prompt if needed). */
	openFolder(): Promise<void>;
}

export class WorkspaceContextService extends Disposable implements IWorkspaceContextService {
	declare readonly _serviceBrand: undefined;

	private _root: string | undefined;
	get root(): string | undefined {
		return this._root;
	}

	private readonly _onDidChangeWorkspace = this._register(new Emitter<void>());
	readonly onDidChangeWorkspace = this._onDidChangeWorkspace.event;

	constructor(
		@INativeHostService private readonly nativeHostService: INativeHostService,
		@IEditorService private readonly editorService: IEditorService
	) {
		super();
	}

	async openFolder(): Promise<void> {
		if (!(await this.editorService.closeAllEditors())) {
			return;
		}
		const folder = await this.nativeHostService.pickFolder();
		if (folder) {
			this._root = folder;
			this._onDidChangeWorkspace.fire();
		}
	}
}

registerSingleton(IWorkspaceContextService, WorkspaceContextService, InstantiationType.Delayed);
