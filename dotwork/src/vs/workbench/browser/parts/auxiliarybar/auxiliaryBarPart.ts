/*---------------------------------------------------------------------------------------------
 *  Dotwork. The secondary side bar, which hosts Chat. The composer is disabled until AI
 *  providers are connected (plan, Days 10-11).
 *--------------------------------------------------------------------------------------------*/

import { $, append } from '../../../../base/browser/dom.js';
import { renderIcon } from '../../../../base/browser/ui/iconLabel/iconLabels.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize } from '../../../../nls.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { Part } from '../../part.js';
import { LayoutCommands } from '../../actions/layoutActions.js';
import { Parts } from '../../../services/layout/browser/layoutService.js';

export class AuxiliaryBarPart extends Part {

	constructor(@ICommandService private readonly commandService: ICommandService) {
		super(Parts.AUXILIARYBAR_PART, 'chat');

		this.minimumSize = 220;
		this.maximumSize = 800;
	}

	create(): void {
		const close = $('button', { title: localize('hideChat', "Hide Chat") }, renderIcon(Codicon.close));
		close.onclick = () => this.commandService.executeCommand(LayoutCommands.toggleAuxiliaryBar);

		const logo = renderIcon(Codicon.circleLargeFilled);
		logo.classList.add('chat__logo');

		append(this.element,
			$('div.chat__header', undefined, $('span.chat__title', undefined, localize('chat', "Chat")), $('span.chat__actions', undefined, close)),
			$('div.chat__empty', undefined,
				logo,
				$('h2', undefined, localize('chatTitle', "Build with Dotwork")),
				$('p', undefined, localize('chatSubtitle', "Ask about your code, or hand a task to a dot."))
			),
			$('div.chat__composer', undefined,
				$('textarea', { placeholder: localize('chatNotConnected', "Chat is not connected yet"), rows: '3', disabled: '' }),
				$('div.chat__composer-bar', undefined,
					$('span.chat__spacer'),
					$('button.send-btn', { title: localize('send', "Send"), disabled: '' }, renderIcon(Codicon.arrowUp))
				)
			)
		);
	}
}
