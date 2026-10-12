/*---------------------------------------------------------------------------------------------
 *  Dotwork. Runs commands from VS Code's `CommandsRegistry`. Modelled on Monaco's
 *  `StandaloneCommandService`; VS Code's workbench version also activates extensions first.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { CommandsRegistry, ICommandEvent, ICommandService } from '../../../../platform/commands/common/commands.js';
import { InstantiationType, registerSingleton } from '../../../../platform/instantiation/common/extensions.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ILogService } from '../../../../platform/log/common/log.js';

export class CommandService extends Disposable implements ICommandService {

	declare readonly _serviceBrand: undefined;

	private readonly _onWillExecuteCommand = this._register(new Emitter<ICommandEvent>());
	readonly onWillExecuteCommand = this._onWillExecuteCommand.event;

	private readonly _onDidExecuteCommand = this._register(new Emitter<ICommandEvent>());
	readonly onDidExecuteCommand = this._onDidExecuteCommand.event;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ILogService private readonly logService: ILogService
	) {
		super();
	}

	async executeCommand<R = unknown>(id: string, ...args: unknown[]): Promise<R | undefined> {
		const command = CommandsRegistry.getCommand(id);
		if (!command) {
			throw new Error(`command '${id}' not found`);
		}

		this.logService.trace('CommandService#executeCommand', id);
		this._onWillExecuteCommand.fire({ commandId: id, args });
		try {
			return await this.instantiationService.invokeFunction(command.handler, ...args) as R;
		} finally {
			this._onDidExecuteCommand.fire({ commandId: id, args });
		}
	}
}

registerSingleton(ICommandService, CommandService, InstantiationType.Delayed);
