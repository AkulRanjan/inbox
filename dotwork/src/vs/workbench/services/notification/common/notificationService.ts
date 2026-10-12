/*---------------------------------------------------------------------------------------------
 *  Dotwork. Implements VS Code's `INotificationService` interface. Status messages (such as
 *  "(Ctrl+K) was pressed. Waiting for second key of chord...") go to the status bar; other
 *  notifications are logged until Dotwork has a notification centre.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { INotification, INotificationHandle, INotificationService, INotificationSourceFilter, IPromptChoice, IStatusHandle, IStatusMessageOptions, NoOpNotification, NotificationMessage, NotificationsFilter, Severity } from '../../../../platform/notification/common/notification.js';

export interface IStatusMessageEvent {
	readonly message: string | undefined;
}

export class NotificationService extends Disposable implements INotificationService {

	declare readonly _serviceBrand: undefined;

	readonly onDidChangeFilter = Event.None;

	private readonly _onDidChangeStatusMessage = this._register(new Emitter<IStatusMessageEvent>());
	/** Not part of VS Code's interface: the status bar listens here for status messages. */
	readonly onDidChangeStatusMessage = this._onDidChangeStatusMessage.event;

	constructor(@ILogService private readonly logService: ILogService) {
		super();
	}

	setFilter(_filter: NotificationsFilter | INotificationSourceFilter): void { }
	getFilter(): NotificationsFilter { return NotificationsFilter.OFF; }
	getFilters(): INotificationSourceFilter[] { return []; }
	removeFilter(_sourceId: string): void { }

	notify(notification: INotification): INotificationHandle {
		this.log(notification.severity, notification.message);
		return new NoOpNotification();
	}

	info(message: NotificationMessage | NotificationMessage[]): void {
		this.log(Severity.Info, message);
	}

	warn(message: NotificationMessage | NotificationMessage[]): void {
		this.log(Severity.Warning, message);
	}

	error(message: NotificationMessage | NotificationMessage[]): void {
		this.log(Severity.Error, message);
	}

	prompt(severity: Severity, message: string, _choices: IPromptChoice[]): INotificationHandle {
		this.log(severity, message);
		return new NoOpNotification();
	}

	status(message: NotificationMessage, options?: IStatusMessageOptions): IStatusHandle {
		const text = typeof message === 'string' ? message : message.message;
		let shown = false;
		const show = () => { shown = true; this._onDidChangeStatusMessage.fire({ message: text }); };
		const showTimer = options?.showAfter ? setTimeout(show, options.showAfter) : (show(), undefined);
		const hideTimer = options?.hideAfter ? setTimeout(() => handle.close(), options.hideAfter) : undefined;

		const handle: IStatusHandle = {
			close: () => {
				clearTimeout(showTimer);
				clearTimeout(hideTimer);
				if (shown) {
					shown = false;
					this._onDidChangeStatusMessage.fire({ message: undefined });
				}
			}
		};
		return handle;
	}

	private log(severity: Severity, message: NotificationMessage | NotificationMessage[]): void {
		const messages = Array.isArray(message) ? message : [message];
		for (const m of messages) {
			const text = typeof m === 'string' ? m : m.message;
			switch (severity) {
				case Severity.Error: this.logService.error(text); break;
				case Severity.Warning: this.logService.warn(text); break;
				default: this.logService.info(text);
			}
		}
	}
}

registerSingleton(INotificationService, NotificationService, InstantiationType.Delayed);
