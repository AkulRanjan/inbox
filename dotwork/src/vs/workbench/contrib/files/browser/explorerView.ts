/*---------------------------------------------------------------------------------------------
 *  Dotwork. The file tree. Folders load their children on first expand. VS Code renders this
 *  with its virtualised list/tree widgets; this plain-DOM tree is enough for small folders.
 *--------------------------------------------------------------------------------------------*/

import { $, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { basename } from '../../../../base/common/path.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IFileService, IFileStat } from '../../../../platform/files/common/files.js';
import { fileIconFor } from '../../../browser/labels.js';
import { IViewlet } from '../../../browser/viewlet.js';
import { IEditorService } from '../../../services/editor/browser/editorService.js';
import { IWorkspaceContextService } from '../../../services/workspace/browser/workspaceService.js';
import { IExplorerService } from './explorerService.js';
import { FileCommands } from './fileCommands.js';

type Children = IFileStat[] | { error: string; };

export class ExplorerView extends Disposable implements IViewlet {

	private container!: HTMLElement;
	private tree: HTMLElement | undefined;
	private readonly children = new Map<string, Children>();
	private readonly expanded = new Set<string>();
	private readonly rows = new Map<string, HTMLElement>();

	constructor(
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@IFileService private readonly fileService: IFileService,
		@IEditorService private readonly editorService: IEditorService,
		@ICommandService private readonly commandService: ICommandService,
		@IExplorerService private readonly explorerService: IExplorerService
	) {
		super();
	}

	render(container: HTMLElement): void {
		this.container = container;

		this._register(this.contextService.onDidChangeWorkspace(() => this.refresh(true)));
		this._register(this.editorService.onDidChangeEditors(() => this.updateActiveRow()));
		this._register(this.explorerService.onDidRequestRefresh(() => this.refresh()));
		this._register(this.explorerService.onDidRequestCollapseAll(() => this.collapseAll()));

		this.refresh(true);
	}

	/** Re-reads the root and every expanded folder. `resetState` also collapses everything. */
	private async refresh(resetState = false): Promise<void> {
		const root = this.contextService.root;
		this.children.clear();
		if (resetState) {
			this.expanded.clear();
		}

		if (!root) {
			const open = $('button.btn-primary', undefined, localize('openFolder', "Open Folder"));
			open.onclick = () => this.commandService.executeCommand(FileCommands.openFolder);
			reset(this.container, $('div.explorer-empty', undefined, $('p', undefined, localize('noFolder', "You have not yet opened a folder.")), open));
			this.tree = undefined;
			return;
		}

		await Promise.all([root, ...this.expanded].map(folder => this.load(folder)));

		const action = (icon: ThemeIcon, title: string, command: string) => {
			const button = $('button', { title }, renderIcon(icon));
			button.onclick = () => this.commandService.executeCommand(command);
			return button;
		};

		this.tree = $('div.tree', { role: 'tree' });
		reset(this.container,
			$('div.section-header', undefined,
				renderIcon(Codicon.chevronDown),
				$('span', { title: root }, basename(root)),
				$('span.section-header__actions', undefined,
					action(Codicon.refresh, localize('refresh', "Refresh Explorer"), FileCommands.refreshExplorer),
					action(Codicon.collapseAll, localize('collapse', "Collapse Folders in Explorer"), FileCommands.collapseExplorerFolders)
				)
			),
			this.tree
		);
		this.renderTree();
	}

	private collapseAll(): void {
		this.expanded.clear();
		this.renderTree();
	}

	private async load(folder: string): Promise<void> {
		try {
			this.children.set(folder, await this.fileService.readdir(folder));
		} catch (error) {
			this.children.set(folder, { error: error instanceof Error ? error.message : String(error) });
		}
	}

	private async toggle(folder: string): Promise<void> {
		if (this.expanded.has(folder)) {
			this.expanded.delete(folder);
		} else {
			if (!this.children.has(folder)) {
				await this.load(folder);
			}
			this.expanded.add(folder);
		}
		this.renderTree();
	}

	private renderTree(): void {
		const root = this.contextService.root;
		if (!this.tree || !root) {
			return;
		}
		this.rows.clear();
		reset(this.tree, ...this.renderChildren(root, 0));
		this.updateActiveRow();
	}

	private renderChildren(folder: string, depth: number): HTMLElement[] {
		const children = this.children.get(folder);
		const indent = 8 + depth * 8;
		if (!children) {
			return [];
		}
		if ('error' in children) {
			return [$('div.tree-row.tree-row--error', { style: `padding-left: ${indent + 16}px`, title: children.error }, localize('readError', "Could not read this folder"))];
		}

		return children.flatMap(stat => {
			if (stat.isDirectory) {
				const open = this.expanded.has(stat.resource);
				const twistie = renderIcon(open ? Codicon.chevronDown : Codicon.chevronRight);
				twistie.classList.add('tree-row__chevron');
				const row = $('div.tree-row', { style: `padding-left: ${indent}px`, role: 'treeitem', 'aria-expanded': String(open) },
					twistie,
					$('span.tree-row__label', undefined, stat.name)
				);
				row.onclick = () => this.toggle(stat.resource);
				return [row, ...(open ? this.renderChildren(stat.resource, depth + 1) : [])];
			}

			const { icon, color } = fileIconFor(stat.name);
			const iconElement = renderIcon(icon);
			iconElement.classList.add('tree-row__icon');
			const label = $('span.tree-row__label', undefined, stat.name);
			label.style.color = color;
			const row = $('div.tree-row', { style: `padding-left: ${indent + 16}px`, role: 'treeitem' }, iconElement, label);
			row.onclick = () => this.editorService.openEditor(stat.resource);
			this.rows.set(stat.resource, row);
			return [row];
		});
	}

	private updateActiveRow(): void {
		const active = this.editorService.activeEditor?.resource;
		for (const [resource, row] of this.rows) {
			row.classList.toggle('tree-row--active', resource === active);
		}
	}
}
