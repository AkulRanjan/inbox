import * as monaco from 'monaco-editor/editor/editor.api';
import { Emitter, Event } from '../../../../base/common/event.js';
import { basename } from '../../../../base/common/path.js';
import { Disposable, DisposableStore } from '../../../../base/common/lifecycle.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { INativeHostService } from '../../../../platform/native/common/native.js';
import { ITextMateService } from '../../textMate/browser/textMateService.js';

export type EditorKind = 'text' | 'binary' | 'tooLarge' | 'error';

/** One open editor tab. Text editors own a Monaco model, so undo history survives tab switches. */
export interface IEditorEntry {
	readonly resource: string;
	readonly name: string;
	readonly kind: EditorKind;
	readonly model?: monaco.editor.ITextModel;
	/** Shown instead of an editor for binary, too-large or unreadable files. */
	readonly message?: string;
	/** Scroll position, cursor and folding, restored when the tab is shown again. */
	viewState?: monaco.editor.ICodeEditorViewState | null;
}

interface IEditorRecord extends IEditorEntry {
	/** `model.getAlternativeVersionId()` at the last load or save: equal means not dirty. */
	savedVersionId: number;
	/** Last dirty state announced through `onDidChangeDirty`. */
	reportedDirty: boolean;
	readonly disposables: DisposableStore;
}

export const IEditorService = createDecorator<IEditorService>('editorService');

export interface IEditorService {
	readonly _serviceBrand: undefined;
	readonly onDidChangeEditors: Event<void>;
	readonly onDidChangeDirty: Event<string>;
	readonly editors: readonly IEditorEntry[];
	readonly activeEditor: IEditorEntry | undefined;
	/** The Monaco editor widget, set by the editor part. */
	activeCodeEditor: monaco.editor.ICodeEditor | undefined;

	openEditor(resource: string): Promise<void>;
	setActiveEditor(resource: string): void;
	isDirty(resource: string): boolean;
	save(resource: string): Promise<boolean>;
	saveAll(): Promise<boolean>;
	/** Closes one editor, asking to save first if it has unsaved changes. Returns false if cancelled. */
	closeEditor(resource: string): Promise<boolean>;
	/** Closes every editor, asking about unsaved changes once. Returns false if cancelled. */
	closeAllEditors(): Promise<boolean>;
	/** Asks about unsaved changes without closing anything (window shutdown). */
	confirmSaveAll(): Promise<boolean>;
}

enum ConfirmResult {
	Save,
	DontSave,
	Cancel
}

export class EditorService extends Disposable implements IEditorService {
	declare readonly _serviceBrand: undefined;

	private readonly records: IEditorRecord[] = [];
	private activeResource: string | undefined;
	private readonly opening = new Map<string, Promise<void>>();
	activeCodeEditor: monaco.editor.ICodeEditor | undefined;

	private readonly _onDidChangeEditors = this._register(new Emitter<void>());
	readonly onDidChangeEditors = this._onDidChangeEditors.event;
	private readonly _onDidChangeDirty = this._register(new Emitter<string>());
	readonly onDidChangeDirty = this._onDidChangeDirty.event;

	constructor(
		@IFileService private readonly fileService: IFileService,
		@INativeHostService private readonly nativeHostService: INativeHostService,
		@ITextMateService private readonly textMateService: ITextMateService
	) {
		super();
	}

	get editors(): readonly IEditorEntry[] {
		return this.records;
	}

	get activeEditor(): IEditorEntry | undefined {
		return this.find(this.activeResource);
	}

	async openEditor(resource: string): Promise<void> {
		if (this.find(resource)) {
			this.setActiveEditor(resource);
			return;
		}
		// A second click while the file is still loading must not open it twice.
		const pending = this.opening.get(resource) ?? this.doOpenEditor(resource);
		this.opening.set(resource, pending);
		try {
			await pending;
		} finally {
			this.opening.delete(resource);
		}
	}

	private async doOpenEditor(resource: string): Promise<void> {
		const record = await this.loadEditor(resource);
		this.records.push(record);
		this.activeResource = resource;
		this._onDidChangeEditors.fire();
	}

	private async loadEditor(resource: string): Promise<IEditorRecord> {
		const base = {
			resource,
			name: basename(resource),
			disposables: new DisposableStore(),
			savedVersionId: 0,
			reportedDirty: false
		};
		let result;
		try {
			result = await this.fileService.readFile(resource);
		} catch (err) {
			return { ...base, kind: 'error', message: `The editor could not be opened: ${errorMessage(err)}` };
		}
		if (result.kind === 'binary') {
			return {
				...base,
				kind: 'binary',
				message: 'The file is not displayed in the text editor because it is either binary or uses an unsupported text encoding.'
			};
		}
		if (result.kind === 'tooLarge') {
			return {
				...base,
				kind: 'tooLarge',
				message: `The file is not displayed in the text editor because it is too large (${Math.round(result.size / 1024 / 1024)} MB).`
			};
		}

		// Languages are registered from the built-in extensions; wait so the model gets the right one.
		await this.textMateService.whenReady;
		const uri = monaco.Uri.file(resource);
		monaco.editor.getModel(uri)?.dispose();
		const model = monaco.editor.createModel(result.value, undefined, uri);
		const record: IEditorRecord = { ...base, kind: 'text', model, savedVersionId: model.getAlternativeVersionId() };
		record.disposables.add(model.onDidChangeContent(() => this.updateDirty(record)));
		record.disposables.add(model);
		return record;
	}

	setActiveEditor(resource: string): void {
		if (this.find(resource) && resource !== this.activeResource) {
			this.activeResource = resource;
			this._onDidChangeEditors.fire();
		}
	}

	isDirty(resource: string): boolean {
		const record = this.find(resource);
		return !!record?.model && record.model.getAlternativeVersionId() !== record.savedVersionId;
	}

	async save(resource: string): Promise<boolean> {
		const record = this.find(resource);
		if (!record?.model) {
			return true;
		}
		// Close the current undo group, as VS Code does, so Undo can return exactly to the saved text.
		record.model.pushStackElement();
		const versionId = record.model.getAlternativeVersionId();
		try {
			await this.fileService.writeFile(resource, record.model.getValue());
		} catch (err) {
			await this.nativeHostService.showMessageBox({
				type: 'error',
				message: `Failed to save '${record.name}'`,
				detail: errorMessage(err),
				buttons: ['OK']
			});
			return false;
		}
		record.savedVersionId = versionId;
		this.updateDirty(record);
		return true;
	}

	async saveAll(): Promise<boolean> {
		for (const record of this.dirtyRecords()) {
			if (!(await this.save(record.resource))) {
				return false;
			}
		}
		return true;
	}

	async closeEditor(resource: string): Promise<boolean> {
		const record = this.find(resource);
		if (!record) {
			return true;
		}
		if (this.isDirty(resource)) {
			const choice = await this.confirm([record]);
			if (choice === ConfirmResult.Cancel) return false;
			if (choice === ConfirmResult.Save && !(await this.save(resource))) return false;
		}
		this.remove(record);
		return true;
	}

	async closeAllEditors(): Promise<boolean> {
		if (!(await this.confirmSaveAll())) {
			return false;
		}
		for (const record of [...this.records]) {
			this.remove(record);
		}
		return true;
	}

	async confirmSaveAll(): Promise<boolean> {
		const dirty = this.dirtyRecords();
		if (dirty.length === 0) return true;
		const choice = await this.confirm(dirty);
		if (choice === ConfirmResult.Cancel) return false;
		if (choice === ConfirmResult.Save) return this.saveAll();
		return true;
	}

	private async confirm(dirty: IEditorRecord[]): Promise<ConfirmResult> {
		const message =
			dirty.length === 1
				? `Do you want to save the changes you made to ${dirty[0].name}?`
				: `Do you want to save the changes to the following ${dirty.length} files?`;
		const detail =
			(dirty.length > 1 ? dirty.map((r) => r.name).join('\n') + '\n\n' : '') +
			"Your changes will be lost if you don't save them.";
		const { response } = await this.nativeHostService.showMessageBox({
			type: 'warning',
			message,
			detail,
			buttons: [dirty.length > 1 ? 'Save All' : 'Save', "Don't Save", 'Cancel'],
			defaultId: 0,
			cancelId: 2
		});
		return response === 0 ? ConfirmResult.Save : response === 1 ? ConfirmResult.DontSave : ConfirmResult.Cancel;
	}

	private remove(record: IEditorRecord): void {
		const index = this.records.indexOf(record);
		this.records.splice(index, 1);
		if (this.activeResource === record.resource) {
			// Like VS Code, activate the neighbour that slid into the closed tab's place.
			this.activeResource = (this.records[index] ?? this.records[index - 1])?.resource;
		}
		record.disposables.dispose();
		this._onDidChangeEditors.fire();
	}

	/** Fires `onDidChangeDirty` only when the dirty state flips, not on every keystroke. */
	private updateDirty(record: IEditorRecord): void {
		const dirty = this.isDirty(record.resource);
		if (dirty !== record.reportedDirty) {
			record.reportedDirty = dirty;
			this._onDidChangeDirty.fire(record.resource);
		}
	}

	private dirtyRecords(): IEditorRecord[] {
		return this.records.filter((r) => this.isDirty(r.resource));
	}

	private find(resource: string | undefined): IEditorRecord | undefined {
		return resource === undefined ? undefined : this.records.find((r) => r.resource === resource);
	}
}

function errorMessage(err: unknown): string {
	const message = err instanceof Error ? err.message : String(err);
	// Strip Electron's "Error invoking remote method 'x': Error: " prefix.
	return message.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, '');
}

registerSingleton(IEditorService, EditorService, InstantiationType.Delayed);
