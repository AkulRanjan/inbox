/*---------------------------------------------------------------------------------------------
 *  Dotwork. The status bar shows only what is known: problem counts, keybinding chord prompts
 *  and the active editor's real settings.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from 'monaco-editor/editor/editor.api';
import { $, append, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { Part } from '../../part.js';
import { IEditorService } from '../../../services/editor/browser/editorService.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';
import { NotificationService } from '../../../services/notification/common/notificationService.js';

export class StatusbarPart extends Part {

	private left!: HTMLElement;
	private message!: HTMLElement;
	private right!: HTMLElement;
	private readonly editorListeners = this._register(new DisposableStore());
	private trackedEditor: monaco.editor.ICodeEditor | undefined;

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@INotificationService private readonly notificationService: INotificationService
	) {
		super(Parts.STATUSBAR_PART, 'status-bar');
	}

	create(): void {
		this.left = $('div.status-bar__group');
		this.message = $('div.status-bar__message');
		this.right = $('div.status-bar__group');
		append(this.element, this.left, this.message, this.right);

		this._register(this.editorService.onDidChangeEditors(() => this.update()));
		this._register(monaco.editor.onDidChangeMarkers(() => this.renderLeft()));
		this._register((this.notificationService as NotificationService).onDidChangeStatusMessage(e => this.message.textContent = e.message ?? ''));
		this.update();
	}

	private update(): void {
		// The editor part creates the code editor lazily; start listening once it exists.
		const editor = this.editorService.activeCodeEditor;
		if (editor && editor !== this.trackedEditor) {
			this.trackedEditor = editor;
			this.editorListeners.clear();
			this.editorListeners.add(editor.onDidChangeCursorPosition(() => this.renderRight()));
			this.editorListeners.add(editor.onDidChangeModel(() => this.renderRight()));
			this.editorListeners.add(editor.onDidChangeModelOptions(() => this.renderRight()));
			this.editorListeners.add(editor.onDidChangeModelLanguage(() => this.renderRight()));
		}
		this.renderLeft();
		this.renderRight();
	}

	private renderLeft(): void {
		const markers = monaco.editor.getModelMarkers({});
		const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length;
		const warnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length;
		reset(this.left,
			$('span.status-bar__item', { title: localize('problems', "{0} errors, {1} warnings", errors, warnings) }, renderIcon(Codicon.error), String(errors), renderIcon(Codicon.warning), String(warnings)),
			$('span.status-bar__item', { title: localize('dotsOffline', "No dot is connected") }, renderIcon(Codicon.circleLargeFilled), localize('dots', "Dots: offline"))
		);
	}

	private renderRight(): void {
		const active = this.editorService.activeEditor;
		const editor = this.editorService.activeCodeEditor;
		const model = active?.kind === 'text' ? active.model : undefined;
		if (!model || !editor) {
			reset(this.right);
			return;
		}

		const position = editor.getPosition();
		const options = model.getOptions();
		const language = monaco.languages.getLanguages().find(l => l.id === model.getLanguageId());
		const items = [
			position ? localize('position', "Ln {0}, Col {1}", position.lineNumber, position.column) : undefined,
			options.insertSpaces ? localize('spaces', "Spaces: {0}", options.indentSize) : localize('tabSize', "Tab Size: {0}", options.tabSize),
			'UTF-8',
			model.getEOL() === '\r\n' ? 'CRLF' : 'LF',
			language?.aliases?.[0] ?? model.getLanguageId()
		];
		reset(this.right, ...items.filter((text): text is string => !!text).map(text => $('span.status-bar__item', undefined, text)));
	}
}
