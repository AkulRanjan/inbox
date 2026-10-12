/*---------------------------------------------------------------------------------------------
 *  Dotwork. File icons for the explorer and editor tabs. VS Code uses an icon theme
 *  (Seti); until Dotwork has one, this maps extensions to codicons and accent colours.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from '../../base/common/codicons.js';
import { extname } from '../../base/common/path.js';
import { ThemeIcon } from '../../base/common/themables.js';

const FILE_ICONS: Record<string, [ThemeIcon, string]> = {
	'.ts': [Codicon.symbolFile, '#3178c6'],
	'.tsx': [Codicon.symbolFile, '#3b9fd8'],
	'.js': [Codicon.symbolFile, '#e8d44d'],
	'.jsx': [Codicon.symbolFile, '#3b9fd8'],
	'.json': [Codicon.json, '#cbcb41'],
	'.md': [Codicon.markdown, '#519aba'],
	'.py': [Codicon.symbolFile, '#4b8bbe'],
	'.css': [Codicon.symbolColor, '#519aba'],
	'.html': [Codicon.code, '#e37933'],
	'.png': [Codicon.fileMedia, '#a074c4'],
	'.svg': [Codicon.fileMedia, '#a074c4']
};

export function fileIconFor(name: string): { icon: ThemeIcon; color: string; } {
	const [icon, color] = FILE_ICONS[extname(name).toLowerCase()] ?? [Codicon.file, '#a9a9a9'];
	return { icon, color };
}
