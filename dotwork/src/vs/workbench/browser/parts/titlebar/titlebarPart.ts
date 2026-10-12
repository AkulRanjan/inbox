/*---------------------------------------------------------------------------------------------
 *  Dotwork. The custom title bar. The menubar renders what features contributed to VS Code's
 *  `MenuRegistry`, honouring each item's `when` clause and precondition, with keybinding labels
 *  from the keybinding service.
 *--------------------------------------------------------------------------------------------*/

import { $, addDisposableListener, append, EventType, reset } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { mainWindow } from '../../../../base/browser/window.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { basename } from '../../../../base/common/path.js';
import { ThemeIcon } from '../../../../base/common/themables.js';
import { localize } from '../../../../nls.js';
import { ICommandAction } from '../../../../platform/action/common/action.js';
import { IMenuItem, isIMenuItem, MenuId, MenuRegistry } from '../../../../platform/actions/common/actions.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { LayoutCommands } from '../../actions/layoutActions.js';
import { Part } from '../../part.js';
import { IWorkbenchLayoutService, Parts } from '../../../services/layout/browser/layoutService.js';
import { IWorkspaceContextService } from '../../../services/workspace/browser/workspaceService.js';

const MENUBAR: [MenuId, string][] = [
	[MenuId.MenubarFileMenu, localize('file', "File")],
	[MenuId.MenubarEditMenu, localize('edit', "Edit")],
	[MenuId.MenubarSelectionMenu, localize('selection', "Selection")],
	[MenuId.MenubarViewMenu, localize('view', "View")],
	[MenuId.MenubarHelpMenu, localize('help', "Help")]
];

function commandTitle(command: ICommandAction): string {
	const title = command.title;
	if (typeof title === 'string') {
		return title;
	}
	return title.mnemonicTitle?.replace(/&&/g, '') ?? title.value;
}

export class TitlebarPart extends Part {

	private menubar!: HTMLElement;
	private commandCenterLabel!: HTMLElement;
	private layoutControls!: HTMLElement;
	private openMenu: MenuId | undefined;

	constructor(
		@ICommandService private readonly commandService: ICommandService,
		@IContextKeyService private readonly contextKeyService: IContextKeyService,
		@IKeybindingService private readonly keybindingService: IKeybindingService,
		@IWorkbenchLayoutService private readonly layoutService: IWorkbenchLayoutService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService
	) {
		super(Parts.TITLEBAR_PART, 'titlebar');
	}

	create(): void {
		this.menubar = $('div.titlebar__menus', { role: 'menubar' });
		this.commandCenterLabel = $('span');
		this.layoutControls = $('div.titlebar__right');

		const logo = $('div.titlebar__logo', undefined, renderIcon(Codicon.circleFilled));
		append(this.element,
			$('div.titlebar__left', undefined, logo, this.menubar),
			$('div.titlebar__center', undefined, $('div.command-center', undefined, renderIcon(Codicon.folder), this.commandCenterLabel)),
			this.layoutControls
		);

		this.renderMenubar();
		this.renderTitle();
		this.renderLayoutControls();

		this._register(this.contextService.onDidChangeWorkspace(() => this.renderTitle()));
		this._register(this.layoutService.onDidChangePartVisibility(() => this.renderLayoutControls()));
		// Close an open menu on any click outside it, or on Escape.
		this._register(addDisposableListener(mainWindow, EventType.MOUSE_DOWN, (e: MouseEvent) => {
			if (!this.menubar.contains(e.target as Node)) {
				this.setOpenMenu(undefined);
			}
		}));
		this._register(addDisposableListener(mainWindow, EventType.KEY_DOWN, (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				this.setOpenMenu(undefined);
			}
		}));
	}

	private renderTitle(): void {
		const root = this.contextService.root;
		this.commandCenterLabel.textContent = root ? basename(root) : 'Dotwork';
		mainWindow.document.title = root ? `${basename(root)} - Dotwork` : 'Dotwork';
	}

	private setOpenMenu(menu: MenuId | undefined): void {
		if (this.openMenu !== menu) {
			this.openMenu = menu;
			this.renderMenubar();
		}
	}

	/** Visible items grouped like VS Code: sorted by group, then order; groups separated by a line. */
	private getMenuGroups(menu: MenuId): IMenuItem[][] {
		const groups = new Map<string, IMenuItem[]>();
		for (const item of MenuRegistry.getMenuItems(menu)) {
			if (isIMenuItem(item) && this.contextKeyService.contextMatchesRules(item.when)) {
				const group = item.group ?? '';
				groups.set(group, [...(groups.get(group) ?? []), item]);
			}
		}
		return [...groups.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([, items]) => items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
	}

	private renderMenubar(): void {
		reset(this.menubar);
		for (const [menu, label] of MENUBAR) {
			const groups = this.getMenuGroups(menu);
			if (groups.length === 0) {
				continue;
			}

			const button = $(`button.menu__label${this.openMenu === menu ? '.menu__label--open' : ''}`, undefined, label);
			// Keep focus where it was (e.g. in the editor) so Edit > Undo acts on it.
			button.onmousedown = e => e.preventDefault();
			button.onclick = () => this.setOpenMenu(this.openMenu === menu ? undefined : menu);
			button.onmouseenter = () => {
				if (this.openMenu) {
					this.setOpenMenu(menu);
				}
			};
			const container = append(this.menubar, $('div.menu', undefined, button));

			if (this.openMenu === menu) {
				const dropdown = append(container, $('div.menu__dropdown', { role: 'menu' }));
				groups.forEach((items, index) => {
					if (index > 0) {
						append(dropdown, $('div.menu__sep'));
					}
					for (const item of items) {
						const enabled = this.contextKeyService.contextMatchesRules(item.command.precondition);
						const keybinding = this.keybindingService.lookupKeybinding(item.command.id)?.getLabel() ?? '';
						const entry = append(dropdown, $('button.menu__item', { role: 'menuitem' },
							$('span', undefined, commandTitle(item.command)),
							$('span.menu__keys', undefined, keybinding)
						));
						if (!enabled) {
							entry.setAttribute('disabled', '');
						}
						entry.onmousedown = e => e.preventDefault();
						entry.onclick = () => {
							this.setOpenMenu(undefined);
							this.commandService.executeCommand(item.command.id);
						};
					}
				});
			}
		}
	}

	private renderLayoutControls(): void {
		const control = (part: Parts, command: string, title: string, on: ThemeIcon, off: ThemeIcon) => {
			const keybinding = this.keybindingService.lookupKeybinding(command)?.getLabel();
			const button = $('button', { title: keybinding ? `${title} (${keybinding})` : title }, renderIcon(this.layoutService.isVisible(part) ? on : off));
			button.onclick = () => this.commandService.executeCommand(command);
			return button;
		};

		reset(this.layoutControls,
			control(Parts.SIDEBAR_PART, LayoutCommands.toggleSidebar, localize('toggleSidebar', "Toggle Primary Side Bar"), Codicon.layoutSidebarLeft, Codicon.layoutSidebarLeftOff),
			control(Parts.PANEL_PART, LayoutCommands.togglePanel, localize('togglePanel', "Toggle Panel"), Codicon.layoutPanel, Codicon.layoutPanelOff),
			control(Parts.AUXILIARYBAR_PART, LayoutCommands.toggleAuxiliaryBar, localize('toggleChat', "Toggle Secondary Side Bar"), Codicon.layoutSidebarRight, Codicon.layoutSidebarRightOff)
		);
	}
}
