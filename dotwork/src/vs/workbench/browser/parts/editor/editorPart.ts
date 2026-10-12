/*---------------------------------------------------------------------------------------------
 *  Dotwork. Tabs, breadcrumbs and one Monaco editor. Switching tabs swaps the editor's model and
 *  restores its view state, so each file keeps its own undo history, scroll position and
 *  selection.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from 'monaco-editor/editor/editor.api';
import { $, append, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { LayoutPriority } from '../../../../base/browser/ui/splitview/splitview.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { isEqualOrParent } from '../../../../base/common/extpath.js';
import { KeyChord, KeyMod } from '../../../../base/common/keyCodes.js';
import { Keybinding, KeyCodeChord } from '../../../../base/common/keybindings.js';
import { isLinux, isMacintosh } from '../../../../base/common/platform.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { KeybindingsRegistry, KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { fileIconFor } from '../../labels.js';
import { Part } from '../../part.js';
import { EditorTextFocusContext } from '../../../common/contextkeys.js';
import { IEditorEntry, IEditorService } from '../../../services/editor/browser/editorService.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';
import { IWorkspaceContextService } from '../../../services/workspace/browser/workspaceService.js';

/** Commands listed on the empty editor, with their real keybindings. */
const WATERMARK_COMMANDS: [string, string][] = [
	[localize('watermark.openFolder', "Open Folder"), 'workbench.action.files.openFolder'],
	[localize('watermark.showExplorer', "Show Explorer"), 'workbench.view.explorer'],
	[localize('watermark.togglePanel', "Toggle Panel"), 'workbench.action.togglePanel'],
	[localize('watermark.toggleChat', "Toggle Secondary Side Bar"), 'workbench.action.toggleAuxiliaryBar']
];

/** Monaco's numeric keybinding (same encoding as VS Code's `KeyMod`/`KeyCode`) for a keybinding. */
function toMonacoKeybinding(keybinding: Keybinding): number | undefined {
	const parts: number[] = [];
	for (const chord of keybinding.chords) {
		if (!(chord instanceof KeyCodeChord)) {
			return undefined;
		}
		let value: number = chord.keyCode;
		if (isMacintosh ? chord.metaKey : chord.ctrlKey) { value |= KeyMod.CtrlCmd; }
		if (isMacintosh ? chord.ctrlKey : chord.metaKey) { value |= KeyMod.WinCtrl; }
		if (chord.shiftKey) { value |= KeyMod.Shift; }
		if (chord.altKey) { value |= KeyMod.Alt; }
		parts.push(value);
	}
	return parts.length === 2 ? KeyChord(parts[0], parts[1]) : parts.length === 1 ? parts[0] : undefined;
}

export class EditorPart extends Part {

	private tabs!: HTMLElement;
	private breadcrumbs!: HTMLElement;
	private editorHost!: HTMLElement;
	private messageHost!: HTMLElement;
	private watermark!: HTMLElement;
	private codeEditor: monaco.editor.IStandaloneCodeEditor | undefined;
	private shownEditor: IEditorEntry | undefined;

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@ICommandService private readonly commandService: ICommandService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
		@IKeybindingService private readonly keybindingService: IKeybindingService
	) {
		super(Parts.EDITOR_PART, 'editor-area');

		this.minimumSize = 70;
		this.priority = LayoutPriority.High;
	}

	create(): void {
		this.tabs = $('div.tabs', { role: 'tablist' });
		this.breadcrumbs = $('div.breadcrumbs');
		this.editorHost = $('div.editor-area__editor');
		this.messageHost = $('div.editor-area__message');
		this.watermark = this.renderWatermark();
		append(this.element, this.tabs, this.breadcrumbs, this.editorHost, this.messageHost, this.watermark);

		this._register(this.editorService.onDidChangeEditors(() => this.render()));
		this._register(this.editorService.onDidChangeDirty(() => this.renderTabs()));
		this.render();
	}

	override layout(size: number, offset: number, orthogonalSize: number | undefined): void {
		super.layout(size, offset, orthogonalSize);
		this.codeEditor?.layout();
	}

	private render(): void {
		this.renderTabs();
		const active = this.editorService.activeEditor;
		this.watermark.hidden = !!active;
		this.breadcrumbs.hidden = !active;
		this.editorHost.hidden = active?.kind !== 'text';
		this.messageHost.hidden = !active || active.kind === 'text';

		if (!active) {
			this.showEditor(undefined);
			return;
		}

		const root = this.contextService.root;
		const relative = root && isEqualOrParent(active.resource, root, !isLinux) ? active.resource.slice(root.length) : active.resource;
		const segments = relative.split(/[\\/]/).filter(Boolean);
		reset(this.breadcrumbs, ...segments.map((segment, index) => {
			const item = $('span.breadcrumbs__item');
			if (index > 0) {
				append(item, renderIcon(Codicon.chevronRight));
			}
			append(item, segment);
			return item;
		}));

		if (active.kind === 'text') {
			this.showEditor(active);
		} else {
			this.showEditor(undefined);
			reset(this.messageHost, $('p', undefined, active.message ?? ''));
		}
	}

	private showEditor(entry: IEditorEntry | undefined): void {
		if (entry === this.shownEditor) {
			return;
		}
		if (this.shownEditor && this.codeEditor) {
			this.shownEditor.viewState = this.codeEditor.saveViewState();
		}
		this.shownEditor = entry;

		if (!entry?.model) {
			this.codeEditor?.setModel(null);
			return;
		}

		const editor = this.getOrCreateCodeEditor();
		editor.setModel(entry.model);
		if (entry.viewState) {
			editor.restoreViewState(entry.viewState);
		}
		editor.layout();
		editor.focus();
	}

	private getOrCreateCodeEditor(): monaco.editor.IStandaloneCodeEditor {
		if (this.codeEditor) {
			return this.codeEditor;
		}

		const editor = this.codeEditor = this._register(monaco.editor.create(this.editorHost, {
			model: null,
			minimap: { enabled: true },
			fontSize: 14,
			fontFamily: `Consolas, 'Courier New', monospace`,
			scrollBeyondLastLine: false,
			renderWhitespace: 'selection',
			smoothScrolling: true,
			cursorSmoothCaretAnimation: 'on',
			bracketPairColorization: { enabled: true }
		}));

		const editorTextFocus = EditorTextFocusContext.bindTo(this.contextKeyService);
		this._register(editor.onDidFocusEditorText(() => editorTextFocus.set(true)));
		this._register(editor.onDidBlurEditorText(() => editorTextFocus.set(false)));

		// Monaco has its own keybinding service and handles keys before they reach the window,
		// so workbench keybindings are also registered with it; their when-clauses still decide.
		for (const item of KeybindingsRegistry.getDefaultKeybindings()) {
			const keybinding = item.keybinding && toMonacoKeybinding(item.keybinding);
			const command = item.command;
			if (keybinding === undefined || keybinding === null || !command || item.weight1 < KeybindingWeight.WorkbenchContrib) {
				continue; // editor-level commands (undo, select all, ...) stay with Monaco
			}
			editor.addCommand(keybinding, () => {
				if (this.contextKeyService.contextMatchesRules(item.when ?? undefined)) {
					this.commandService.executeCommand(command, ...(item.commandArgs !== undefined ? [item.commandArgs] : []));
				}
			});
		}

		this.editorService.activeCodeEditor = editor;
		return editor;
	}

	private renderTabs(): void {
		const active = this.editorService.activeEditor;
		this.tabs.hidden = this.editorService.editors.length === 0;

		reset(this.tabs, ...this.editorService.editors.map(entry => {
			const isActive = entry === active;
			const dirty = this.editorService.isDirty(entry.resource);
			const { icon, color } = fileIconFor(entry.name);

			const close = $(`button.tab__close${dirty ? '.tab__close--dirty' : ''}`, { title: dirty ? localize('unsaved', "Unsaved changes") : localize('close', "Close") }, renderIcon(dirty ? Codicon.circleFilled : Codicon.close));
			close.onclick = e => {
				e.stopPropagation();
				this.editorService.closeEditor(entry.resource);
			};

			const iconElement = renderIcon(icon);
			iconElement.classList.add('tab__icon');
			const label = $('span', undefined, entry.name);
			if (isActive) {
				label.style.color = color;
			}

			const tab = $(`div.tab${isActive ? '.tab--active' : ''}`, { role: 'tab', title: entry.resource, 'aria-selected': String(isActive) }, iconElement, label, close);
			tab.onclick = () => this.editorService.setActiveEditor(entry.resource);
			tab.onauxclick = e => {
				if (e.button === 1) {
					this.editorService.closeEditor(entry.resource);
				}
			};
			return tab;
		}));
	}

	private renderWatermark(): HTMLElement {
		const rows: HTMLElement[] = [];
		for (const [label, commandId] of WATERMARK_COMMANDS) {
			const keybinding = this.keybindingService.lookupKeybinding(commandId);
			if (!keybinding) {
				continue;
			}
			const keys = (keybinding.getLabel() ?? '').split(/\s+|(?<=\S)\+/);
			rows.push($('tr', undefined, $('td', undefined, label), $('td', undefined, ...keys.map(k => $('kbd', undefined, k)))));
		}

		const logo = renderIcon(Codicon.circleLargeFilled);
		logo.classList.add('watermark__logo');
		return $('div.watermark', undefined, logo, $('table', undefined, $('tbody', undefined, ...rows)));
	}
}
