# Dotwork

A desktop IDE built on VS Code's stack, using VS Code's own source code for its foundation.

| Layer | What Dotwork uses |
| --- | --- |
| Shell | Electron 43.7.7 (VS Code's exact version), sandboxed renderer, app served from a private `dotwork-file://` scheme like VS Code's `vscode-file://` |
| Foundation | **VS Code's source**, copied unchanged: events, disposables, dependency injection, commands, context keys and `when` clauses, keybinding resolution and dispatch, menus, DOM helpers, split view and sash, codicons |
| Layers | `base` / `platform` / `editor` / `workbench` / `code`, split by environment (`common`, `browser`, `node`, `electron-main`, `electron-browser`), enforced by lint |
| UI | Plain DOM, no UI framework |
| Editor | Monaco 0.57, built from the same VS Code commit as the copied sources |
| Highlighting | TextMate grammars from VS Code's built-in extensions, `vscode-textmate` + `vscode-oniguruma`, Dark Modern theme published as `--vscode-*` CSS variables |
| Toolchain | TypeScript 6, gulp + esbuild, mocha + sinon, ESLint 10 + typescript-eslint, Node 24 (`.nvmrc`), VS Code's compiler options, tabs and semicolons |

## VS Code sources

`build/vscode-sources.txt` lists every file copied from
[microsoft/vscode](https://github.com/microsoft/vscode) (MIT, see `LICENSE-vscode.txt`) and the
commit they come from. They keep Microsoft's copyright header, are never edited here, and are
excluded from Dotwork's lint and formatter (VS Code lints them upstream). VS Code's own unit tests
for them run with `npm test`. To move to a newer VS Code commit:

```bash
node build/update-vscode-sources.mjs <commit>   # use monaco-editor's `vscodeRef`
npm run typecheck && npm test
```

Dotwork's own files implement VS Code interfaces where VS Code's implementation would pull in much
more (configuration, notifications, commands, keybindings over the US layout), modelled on Monaco's
standalone services.

## Develop

Requires Node 24 (`nvm use`).

```bash
npm install
npm run dev           # build once and launch
npm run watch         # rebuild on change; then Help > Reload Window in the app
npm start             # launch the last build
npm test              # build and run unit tests (Dotwork's and VS Code's)
npm run typecheck
npm run lint
npm run format        # TypeScript's formatter with VS Code's settings
```
