/*---------------------------------------------------------------------------------------------
 *  Dotwork. The workbench keybinding service: VS Code's `AbstractKeybindingService` (chords,
 *  when-clauses, single-modifier chords) fed by window key events, with the US keyboard layout
 *  resolver that Monaco's standalone service also uses. VS Code's desktop service additionally
 *  reads the OS keyboard layout through `native-keymap`.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { StandardKeyboardEvent } from '../../../../base/browser/keyboardEvent.js';
import { mainWindow } from '../../../../base/browser/window.js';
import { KeyCodeChord, Keybinding, ResolvedKeybinding } from '../../../../base/common/keybindings.js';
import { Disposable, IDisposable } from '../../../../base/common/lifecycle.js';
import { OS } from '../../../../base/common/platform.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { AbstractKeybindingService } from '../../../../platform/keybinding/common/abstractKeybindingService.js';
import { IKeybindingService, IKeyboardEvent, KeybindingsSchemaContribution } from '../../../../platform/keybinding/common/keybinding.js';
import { KeybindingResolver } from '../../../../platform/keybinding/common/keybindingResolver.js';
import { KeybindingsRegistry } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { ResolvedKeybindingItem } from '../../../../platform/keybinding/common/resolvedKeybindingItem.js';
import { USLayoutResolvedKeybinding } from '../../../../platform/keybinding/common/usLayoutResolvedKeybinding.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { INotificationService } from '../../../../platform/notification/common/notification.js';
import { ITelemetryService } from '../../../../platform/telemetry/common/telemetry.js';

export class WorkbenchKeybindingService extends AbstractKeybindingService {

	private cachedResolver: KeybindingResolver | null = null;

	constructor(
		@IContextKeyService contextKeyService: IContextKeyService,
		@ICommandService commandService: ICommandService,
		@ITelemetryService telemetryService: ITelemetryService,
		@INotificationService notificationService: INotificationService,
		@ILogService logService: ILogService
	) {
		super(contextKeyService, commandService, telemetryService, notificationService, logService);

		this._register(dom.addDisposableListener(mainWindow, dom.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			const keyEvent = new StandardKeyboardEvent(e);
			if (this._dispatch(keyEvent, keyEvent.target)) {
				keyEvent.preventDefault();
				keyEvent.stopPropagation();
			}
		}));

		this._register(dom.addDisposableListener(mainWindow, dom.EventType.KEY_UP, (e: KeyboardEvent) => {
			const keyEvent = new StandardKeyboardEvent(e);
			if (this._singleModifierDispatch(keyEvent, keyEvent.target)) {
				keyEvent.preventDefault();
			}
		}));
	}

	protected _getResolver(): KeybindingResolver {
		if (!this.cachedResolver) {
			const defaults: ResolvedKeybindingItem[] = [];
			for (const item of KeybindingsRegistry.getDefaultKeybindings()) {
				const when = item.when || undefined;
				if (!item.keybinding) {
					defaults.push(new ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, true, null, false));
					continue;
				}
				for (const resolved of USLayoutResolvedKeybinding.resolveKeybinding(item.keybinding, OS)) {
					defaults.push(new ResolvedKeybindingItem(resolved, item.command, item.commandArgs, when, true, null, false));
				}
			}
			this.cachedResolver = new KeybindingResolver(defaults, [], str => this._log(str));
		}
		return this.cachedResolver;
	}

	protected _documentHasFocus(): boolean {
		return mainWindow.document.hasFocus();
	}

	resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
		return USLayoutResolvedKeybinding.resolveKeybinding(keybinding, OS);
	}

	resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
		const chord = new KeyCodeChord(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode);
		return new USLayoutResolvedKeybinding([chord], OS);
	}

	resolveUserBinding(_userBinding: string): ResolvedKeybinding[] {
		return []; // no keybindings.json yet
	}

	registerSchemaContribution(_contribution: KeybindingsSchemaContribution): IDisposable {
		return Disposable.None;
	}

	_dumpDebugInfo(): string {
		return '';
	}

	_dumpDebugInfoJSON(): string {
		return '';
	}

	override enableKeybindingHoldMode(_commandId: string): Promise<void> | undefined {
		return undefined;
	}
}

registerSingleton(IKeybindingService, WorkbenchKeybindingService, InstantiationType.Eager);
