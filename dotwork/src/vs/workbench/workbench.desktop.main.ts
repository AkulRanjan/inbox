// Everything the desktop workbench is made of. Importing a module registers its services,
// commands, keybindings, menus and views (VS Code: `vs/workbench/workbench.desktop.main`).

// Platform services
import './services/commands/common/commandService.js';
import '../platform/files/electron-browser/fileService.js';
import '../platform/native/electron-browser/nativeHostService.js';

// Workbench services
import './services/notification/common/notificationService.js';
import './services/keybinding/browser/keybindingService.js';
import './services/layout/browser/layoutService.js';
import './services/viewlets/browser/viewletService.js';
import './services/textMate/browser/textMateService.js';
import './services/editor/browser/editorService.js';
import './services/workspace/browser/workspaceService.js';
import './services/lifecycle/electron-browser/lifecycleService.js';

// Actions
import './browser/actions/layoutActions.js';
import './browser/actions/editActions.js';
import './browser/actions/windowActions.js';

// Contributions
import './contrib/files/browser/explorerService.js';
import './contrib/files/browser/files.contribution.js';
import './contrib/placeholders/browser/placeholders.contribution.js';

export { Workbench } from './browser/workbench.js';
