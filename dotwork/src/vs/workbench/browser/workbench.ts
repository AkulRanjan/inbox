/*---------------------------------------------------------------------------------------------
 *  Dotwork. Creates the services and parts and lays them out, like VS Code's `Workbench`:
 *
 *    title bar
 *    activity bar | side bar | editor / panel | secondary side bar
 *    status bar
 *
 *  VS Code arranges parts with its grid widget; Dotwork nests two of VS Code's split views.
 *--------------------------------------------------------------------------------------------*/

import { $, addDisposableListener, append, EventType } from '../../base/browser/dom.js';
import { Orientation } from '../../base/browser/ui/sash/sash.js';
import { IView, LayoutPriority, SplitView } from '../../base/browser/ui/splitview/splitview.js';
import { mainWindow } from '../../base/browser/window.js';
import { Color } from '../../base/common/color.js';
import { Event } from '../../base/common/event.js';
import { Disposable } from '../../base/common/lifecycle.js';
import { IConfigurationService } from '../../platform/configuration/common/configuration.js';
import { InMemoryConfigurationService } from '../../platform/configuration/common/inMemoryConfigurationService.js';
import { ContextKeyService } from '../../platform/contextkey/browser/contextKeyService.js';
import { IContextKeyService } from '../../platform/contextkey/common/contextkey.js';
import { SyncDescriptor } from '../../platform/instantiation/common/descriptors.js';
import { getSingletonServiceDescriptors } from '../../platform/instantiation/common/extensions.js';
import { IInstantiationService } from '../../platform/instantiation/common/instantiation.js';
import { InstantiationService } from '../../platform/instantiation/common/instantiationService.js';
import { ServiceCollection } from '../../platform/instantiation/common/serviceCollection.js';
import { IKeybindingService } from '../../platform/keybinding/common/keybinding.js';
import { ConsoleLogger, ILogService } from '../../platform/log/common/log.js';
import { LogService } from '../../platform/log/common/logService.js';
import { ITelemetryService } from '../../platform/telemetry/common/telemetry.js';
import { NullTelemetryService } from '../../platform/telemetry/common/telemetryUtils.js';
import { IWorkbenchLayoutService, Parts } from '../services/layout/browser/layoutService.js';
import { ILifecycleService } from '../services/lifecycle/common/lifecycle.js';
import { ITextMateService } from '../services/textMate/browser/textMateService.js';
import { WorkbenchContextKeysHandler } from './contextkeys.js';
import { Part } from './part.js';
import { ActivitybarPart } from './parts/activitybar/activitybarPart.js';
import { AuxiliaryBarPart } from './parts/auxiliarybar/auxiliaryBarPart.js';
import { EditorPart } from './parts/editor/editorPart.js';
import { PanelPart } from './parts/panel/panelPart.js';
import { SidebarPart } from './parts/sidebar/sidebarPart.js';
import { StatusbarPart } from './parts/statusbar/statusbarPart.js';
import { TitlebarPart } from './parts/titlebar/titlebarPart.js';

const SEPARATOR_BORDER = Color.fromHex('#2b2b2b');

export class Workbench extends Disposable {

	constructor(private readonly parent: HTMLElement) {
		super();
	}

	startup(): void {
		const services = new ServiceCollection(...getSingletonServiceDescriptors());
		services.set(ILogService, this._register(new LogService(new ConsoleLogger())));
		services.set(ITelemetryService, NullTelemetryService);
		services.set(IConfigurationService, this._register(new InMemoryConfigurationService()));
		services.set(IContextKeyService, new SyncDescriptor(ContextKeyService));

		const instantiationService = this._register(new InstantiationService(services, true));
		instantiationService.invokeFunction(accessor => {
			// Services that must run from the start, not when first asked for.
			accessor.get(IKeybindingService);
			accessor.get(ILifecycleService);
			accessor.get(ITextMateService);

			this.createWorkbench(accessor.get(IInstantiationService), accessor.get(IWorkbenchLayoutService));
		});
		this._register(instantiationService.createInstance(WorkbenchContextKeysHandler));
	}

	private createWorkbench(instantiationService: IInstantiationService, layoutService: IWorkbenchLayoutService): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const create = <T extends Part>(ctor: new (...args: any[]) => T): T => {
			const part = this._register(instantiationService.createInstance(ctor));
			part.create();
			return part;
		};

		const titlebar = create(TitlebarPart);
		const activitybar = create(ActivitybarPart);
		const sidebar = create(SidebarPart);
		// The editor part sets up the code editor that the status bar listens to, so it comes first.
		const editor = create(EditorPart);
		const panel = create(PanelPart);
		const auxiliaryBar = create(AuxiliaryBarPart);
		const statusbar = create(StatusbarPart);

		const main = $('div.workbench__main');
		append(this.parent, $('div.workbench', undefined,
			titlebar.element,
			$('div.workbench__body', undefined, activitybar.element, main),
			statusbar.element
		));

		// Editor above panel.
		const centerElement = $('div.workbench__center');
		const vertical = this._register(new SplitView<number, Part>(centerElement, { orientation: Orientation.VERTICAL, proportionalLayout: false, styles: { separatorBorder: SEPARATOR_BORDER } }));
		vertical.addView(editor, 400, undefined, true);
		vertical.addView(panel, 250, undefined, true);

		// Side bar | editor and panel | secondary side bar.
		const center: IView<number> = {
			element: centerElement,
			minimumSize: 220,
			maximumSize: Number.POSITIVE_INFINITY,
			priority: LayoutPriority.High,
			onDidChange: Event.None,
			layout: (width, _offset, height) => vertical.layout(height ?? 0, width)
		};
		const horizontal = this._register(new SplitView<number>(main, { orientation: Orientation.HORIZONTAL, proportionalLayout: false, styles: { separatorBorder: SEPARATOR_BORDER } }));
		horizontal.addView(sidebar, 260, undefined, true);
		horizontal.addView(center, 600, undefined, true);
		horizontal.addView(auxiliaryBar, 340, undefined, true);

		// Views were added with `skipLayout` so their sizes survive until the first real layout.
		const layout = () => horizontal.layout(main.clientWidth, main.clientHeight);
		layout();
		this._register(addDisposableListener(mainWindow, EventType.RESIZE, layout));

		this._register(layoutService.onDidChangePartVisibility(({ part, visible }) => {
			switch (part) {
				case Parts.SIDEBAR_PART: horizontal.setViewVisible(0, visible); break;
				case Parts.AUXILIARYBAR_PART: horizontal.setViewVisible(2, visible); break;
				case Parts.PANEL_PART: vertical.setViewVisible(1, visible); break;
			}
		}));
	}
}
