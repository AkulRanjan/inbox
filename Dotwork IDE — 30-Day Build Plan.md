# Dotwork IDE — 30-Day Build Plan

Oct 1, 2026 · @Prakhar Sahu

## Summary

By Oct 31 you ship **Dotwork v0.1** (working name): a from-scratch Electron desktop IDE built around the Monaco editor, with bring-your-own-key AI and a Dots panel that hands background work to an Open Dot agent. The dot works in an isolated git worktree, and its results come back as diffs you review and merge inside the editor.

This mirrors the core promise of OpenAI's dots for developers: an always-on agent that builds and tests fixes, then brings you complete changes to review. Since OpenAI's dots have no public API, Open Dot stands in, behind an interface that can later wrap the real thing.

**The Oct 31 demo (everything in this plan serves it):**

1. Open a small Python repo in Dotwork. Edit in Monaco, run tests in the integrated terminal.
2. Ask the AI chat (your key: OpenAI, Anthropic, Gemini, OpenRouter or local Ollama) to explain a function. Press Ctrl+K to refactor a selection, preview the diff, accept.
3. A test fails. Select the output, choose **Send to dot**. Your dot takes the task in its own worktree.
4. The dot asks before running `pip install`. You approve from an IDE toast.
5. The dot finishes. **Dot Inbox** shows a proposal; open the side-by-side diff, accept, and it merges into your branch.
6. Add a routine: "Every night at 2am, run the tests and propose fixes." Next morning, proposals are waiting.

## Decisions locked in

Six choices are settled from your answers; one (Dotwork's own license) is my recommendation for you to confirm.

| Decision | Choice | Why |
| --- | --- | --- |
| Editor base | Own app shell, built from scratch; Monaco as the editing component | Monaco is VS Code's own editor engine. Writing a text engine (buffer, rendering, cursors, undo) would consume the whole month. |
| Desktop stack | Electron + TypeScript + React (built with Vite) | VS Code, Cursor and Windsurf all ship on Electron. Terminal, LSP and MCP libraries exist in TypeScript, and Open Dot is TypeScript too. |
| IDE's own AI | Multi-provider BYOK through the Vercel AI SDK | One streaming and tool-calling API across OpenAI, Anthropic, Google, OpenRouter and any OpenAI-compatible server such as Ollama. |
| Dots backend | [composio-community/open-dot](https://github.com/composio-community/open-dot), run as a local sidecar | Your pick. It already has dots' core pieces: rules, approval cards, cron routines, memory, its own computer. |
| Integration contract | HTTP bridge + server-sent events + git worktrees | Loose coupling. The same contract can later wrap Hermes Agent or real OpenAI dots. |
| Team and time | Solo, Oct 1 to Oct 31 | Scope is cut to a demoable v0.1 with buffer days and weekly gates. |
| Dotwork license (proposed) | MIT | Hacktoberfest-friendly, and "Sign in with ChatGPT" plan usage is currently offered to open-source, locally hosted apps. |

## The dots situation

OpenAI's dots cannot be called from a third-party IDE today, so Dotwork talks to Open Dot and keeps a door open for the real product.

**What OpenAI shipped (Sep 29, DevDay).** Dots are always-on agents on GPT-6 Astra, each with its own cloud computer and browser, reaching 4,000+ apps through plugins. You talk to them in ChatGPT, Slack or Teams, on Pro or Business Premium plans. Neither the announcement nor the help center describes a developer API for dots.

**The official doors, for after v0.1:**

1. **Plugin + MCP Events.** Dotwork exposes an MCP server as a ChatGPT plugin; a dot connects to it. MCP Events lets the IDE trigger work via signed webhooks, but needs MCP 2.0 and a public HTTPS endpoint, so a local IDE needs a relay.
2. **Local computer access.** A dot can connect to your laptop and run local Codex tasks and skills there.
3. **Codex cloud + GitHub.** A dot works in a Codex cloud environment and opens pull requests that Dotwork could list.

**What Open Dot gives you, and what to watch:**

| Fact (checked Oct 1) | What it means for the plan |
| --- | --- |
| One commit, 0 stars, created this week | Expect breaking changes. Pin a commit SHA and isolate it behind an adapter. |
| No LICENSE file; `package.json` says `"private": true` | By default you may run it but not redistribute it or a fork. Keep it a separate install; ask the maintainers for a license on Day 1. |
| Desktop build targets macOS arm64; the server is Next.js 16 on Node 22+ | Run it from source (`pnpm dev`, port 3100) on Linux or Windows. Off macOS, its vault falls back to a 0600 key file. |
| Writes go through Next.js server actions in `src/app/actions.ts`; reads stream from `/api/events` (SSE) | There is no stable REST API, so you add a small bridge of REST routes (Week 3). |
| Needs `OPENAI_API_KEY`; OpenRouter is optional for open models, which lose OpenAI's computer tool | The dot side is OpenAI-first even though the IDE side is multi-provider. |
| Computer modes: cloud (E2B), docker, local; each dot has its own `/workspace` folder | Point a dot's workspace at a git worktree with a \~10-line patch to `computer/shell.ts`. |

If the license never arrives, swap in Hermes Agent (MIT), which already speaks the Agent Client Protocol for editors, behind the same interface.

## Architecture

The UI never touches Node or keys, Open Dot runs as a separate local server, and the only hand-off point for code is a git worktree that Dotwork creates, commits and diffs.

&#91;embedded content: Dotwork architecture · 2 app processes, 3 outside parts, 2 git trees\]

Open Dot calls OpenAI with its own key; Dotwork's AI features call whichever provider you configured. Approval cards travel back over the SSE stream and are answered through the REST bridge.

## Tech stack

Every layer uses a library that production IDEs already rely on, so your month goes into the AI and dots features rather than plumbing. Install the latest stable versions on Day 2 and pin them in the lockfile.

| Layer | Library | Purpose |
| --- | --- | --- |
| App shell | Electron + electron-vite | Main, preload and renderer builds with hot reload |
| UI | React, TypeScript, Zustand, Tailwind CSS | Panels, views and app state |
| Layout | react-resizable-panels | VS Code-style split panes for sidebar, editor and bottom panel |
| Editor | monaco-editor (bundled locally, never from a CDN) + @monaco-editor/react | Editing, tabs, diff editor, inline-completion API |
| Icons | @vscode/codicons | Familiar IDE icons |
| Terminal | @xterm/xterm + @xterm/addon-fit + node-pty | Integrated shell; node-pty is native, so rebuild it for Electron with @electron/rebuild |
| Files | Node `fs` + chokidar | File tree and change watching |
| Search | @vscode/ripgrep | Fast project-wide search (ships the `rg` binary) |
| Git | simple-git (wraps the git CLI) | Status, diff, commit, branches, worktrees |
| AI | `ai` (Vercel AI SDK) + @ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google, @openrouter/ai-sdk-provider, @ai-sdk/openai-compatible | Streaming chat, tool calls, one interface for every provider including Ollama and LM Studio |
| Secrets | Electron `safeStorage` | Encrypt API keys at rest with the OS keychain |
| IPC contract | zod | Validate every message between renderer and main |
| Dots | Open Dot sidecar (pinned SHA) + your bridge patch; eventsource-parser | Background agent and its event stream |
| Tests | Vitest; Playwright's Electron support | Unit and end-to-end |
| Packaging | electron-builder | Windows, macOS and Linux installers |
| Later | monaco-languageclient + Pyright; @modelcontextprotocol/sdk | Python language server; MCP server for real OpenAI dots |

## Repository layout

One repo, three process folders, with all Node work in `main` and all UI in `renderer`. Clone Open Dot as a sibling folder, not inside Dotwork, so its missing license never touches your repo.

```text
projects/
├─ open-dot/                    # Open Dot clone, pinned SHA, your bridge patch applied locally
└─ dotwork/
   ├─ electron.vite.config.ts
   ├─ package.json
   ├─ src/
   │  ├─ main/                  # Electron main process (Node)
   │  │  ├─ index.ts            # app lifecycle, window, menus, security flags
   │  │  ├─ ipc/                # one file per domain, every handler zod-validated
   │  │  │  ├─ fs.ts  search.ts  git.ts  terminal.ts  ai.ts  dots.ts  settings.ts
   │  │  ├─ services/
   │  │  │  ├─ workspace.ts     # open folder, file tree, chokidar watcher, path guard
   │  │  │  ├─ pty.ts           # node-pty sessions
   │  │  │  ├─ search.ts        # ripgrep wrapper
   │  │  │  ├─ git.ts           # status, diff, commit, worktrees
   │  │  │  ├─ secrets.ts       # safeStorage-encrypted API keys
   │  │  │  └─ settings.ts
   │  │  ├─ ai/
   │  │  │  ├─ providers.ts     # registry: provider id -> AI SDK model
   │  │  │  ├─ chat.ts          # streamText + abort
   │  │  │  ├─ inlineEdit.ts    # selection + instruction -> replacement
   │  │  │  ├─ completion.ts    # ghost-text suggestions
   │  │  │  ├─ context.ts       # @file, @selection, @problems, @terminal, budget
   │  │  │  └─ tools.ts         # read_file, search, propose_edit, run_command
   │  │  └─ dots/
   │  │     ├─ provider.ts      # DotProvider interface + DotEvent types
   │  │     ├─ opendot/         # sidecar launcher, bridge client, SSE client
   │  │     ├─ mock/            # scripted MockDotProvider for dev and tests
   │  │     └─ proposals.ts     # worktree lifecycle, diff, accept/reject
   │  ├─ preload/index.ts       # contextBridge: the only API the UI can call
   │  ├─ shared/                # types + zod schemas used by main and renderer
   │  └─ renderer/
   │     ├─ App.tsx
   │     ├─ layout/             # activity bar, sidebar, editor area, panel, status bar
   │     ├─ editor/             # Monaco setup, tabs, diff view, inline completion, Ctrl+K
   │     ├─ views/              # Explorer, Search, Git, Chat, Dots, Inbox, Settings
   │     ├─ commands/           # command registry + palette
   │     └─ store/              # Zustand slices
   ├─ patches/opendot-bridge.patch   # your Open Dot changes, kept for an upstream PR
   ├─ fixtures/demo-repo/       # tiny Python project with one failing pytest
   ├─ tests/   e2e/
   └─ docs/ARCHITECTURE.md  docs/DEMO.md
```

## MVP scope

v0.1 is the demo plus the editor basics it needs; anything else waits. A should-have starts only after the week's gate passes.

**Must have (v0.1, Oct 31)**

- Open folder, recent folders, file tree with create, rename, delete
- Tabs, Monaco editing, save, dirty markers, syntax highlighting by extension
- Command palette (Ctrl+Shift+P) and quick open (Ctrl+P)
- Project search with ripgrep
- Integrated terminal
- Git: status, stage, diff, commit, current branch
- Settings with encrypted API keys and a model picker
- AI chat with streaming, @file / @selection / @problems / @terminal context
- Inline edit (Ctrl+K) with diff preview, accept, reject, undo
- Ghost-text autocomplete through one provider path, toggleable
- Dots view: list and create dots, chat, live status, pause and resume
- Approval cards from the dot, resolved inside the IDE
- Delegate a task: worktree, proposal, diff review, accept or reject
- One routine (nightly test-and-fix) and a mock dot provider

**Should have (pick one on Day 27)**

- Python language server (Pyright) for errors and go-to-definition
- Agent mode in chat: multi-step tool use, edits only as proposals
- IDE events that wake the dot, such as a failing test run
- Rules editor with presets
- Installers for all three operating systems

**Cut from v0.1**

- VS Code extension compatibility or a marketplace
- Debugger (Debug Adapter Protocol)
- Remote / SSH development
- Real OpenAI dots plugin
- Codebase embeddings index
- Auto-update, settings sync, collaborative editing

## AI layer design

All model calls run in the main process, so API keys never reach the UI and there are no CORS problems. The renderer only sends a request and receives a token stream.

**Provider registry.** Settings hold a list of providers, each with a kind, optional base URL and a key reference. Each feature gets its own model role, so you can use a strong model for chat and a cheap or local one for autocomplete.

```ts
// src/shared/ai.ts
type ProviderKind = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'openai-compatible';
interface ProviderConfig { id: string; kind: ProviderKind; baseURL?: string; keyRef?: string }
interface ModelRoles { chat: string; edit: string; complete: string } // "providerId:modelId"
```

List models from the provider where it offers a models endpoint, and always let the user type a model id. Model names change monthly, so never hardcode them.

**Chat.** `streamText` in main, streamed to the renderer over IPC with a request id and an abort signal. Context chips show exactly what is sent:

- `@file` and `@selection` from Monaco
- `@problems` from Monaco markers
- `@terminal` with the last 200 lines
- `@diff` from the git working tree

Trim context by priority (selection, then current file, then the rest) to fit the model's window. Render replies as markdown with Copy and Insert buttons on code blocks.

**Inline edit (Ctrl+K).** Send the selection, about 50 lines around it, the file path and the instruction. Ask for replacement code only, inside one fenced block. Show the result as a diff, and apply it with `editor.executeEdits` so Ctrl+Z still works.

**Autocomplete (ghost text).** Register `monaco.languages.registerInlineCompletionsProvider`. Starting values to tune:

- Debounce 250 ms, cancel on every keystroke
- Prefix about 2,000 characters, suffix about 500
- Cache by a hash of the prefix
- Prefer a fill-in-the-middle capable model, such as a local coder model through Ollama; fall back to a prompt with a small fast model
- Off by default for paid providers, with a status-bar toggle, because it fires constantly

**Agent mode (should-have).** Chat with tools: `read_file`, `list_dir`, `search`, `propose_edit` and `run_command`. Edits become pending diffs, never direct writes, and every command needs your approval. Cap a run at 8 steps.

**Privacy defaults.** Never send `.env` files, key files or anything matched by `.gitignore` unless the user attaches it explicitly.

## Dots integration design

Dotwork talks to every dot backend through one `DotProvider` interface. Open Dot is the first adapter, a mock is the second, and git worktrees are how code changes travel back.

```ts
// src/main/dots/provider.ts
export interface DotProvider {
  id: 'opendot' | 'mock' | 'hermes' | 'openai-dots';
  connect(): Promise<void>;
  listDots(): Promise<Dot[]>;
  createDot(input: { name: string; purpose: string }): Promise<string>;
  send(dotId: string, text: string, opts?: { conversationId?: string }): Promise<void>;
  setWorkspace(dotId: string, absPath: string | null): Promise<void>;
  resolveApproval(cardId: string, choice: 'approve' | 'deny' | 'always', answer?: string): Promise<void>;
  addRule(dotId: string | null, action: string, decision: 'allow' | 'ask' | 'never'): Promise<void>;
  addRoutine(dotId: string, r: { name: string; instruction: string; cron: string }): Promise<void>;
  pause(dotId: string): Promise<void>;
  resume(dotId: string): Promise<void>;
  stop(dotId: string): Promise<void>;
  events(): AsyncIterable<DotEvent>; // message, status, approval_card, task_done, error
}
```

### Open Dot adapter: three pieces

1. **Sidecar launcher.** Main spawns Open Dot from its folder with `OPENAI_API_KEY` from safeStorage, `DOTS_COMPUTER=docker` (or `local` without Docker) and a fresh random `OPEN_DOT_BRIDGE_TOKEN`. It health-checks `http://127.0.0.1:3100`, restarts on crash and stops on quit. Settings also allow "already running at URL".
2. **Bridge patch** (\~150 to 250 lines, saved as `patches/opendot-bridge.patch`). New route handlers under `src/app/api/bridge/` that check the bearer token and call the same functions `actions.ts` already calls. Plus an optional per-dot `workspacePath` that `workspaceDir()` in `computer/shell.ts` returns when set.
3. **Event client.** Subscribe to `GET /api/events` (one snapshot, then live events), map each event to a `DotEvent`, reconnect with backoff.

| Bridge route | Wraps |
| --- | --- |
| `POST /api/bridge/dots` | `repo.createDot` (same as `createDot` in actions.ts) |
| `POST /api/bridge/dots/:id/messages` | `runtime.sendMessage`, or `repo.createConversation` + `runtime.sendMessage` for a new chat |
| `POST /api/bridge/cards/:messageId` | `runtime.resolveCard` (approve, deny, always, answer) |
| `POST /api/bridge/rules` | `repo.addRule` |
| `POST /api/bridge/dots/:id/routines` | `repo.addRoutine` (validated cron) |
| `POST /api/bridge/dots/:id/(pause, resume, stop)` | `runtime.pause`, `runtime.resume`, `runtime.stop` |
| `PUT /api/bridge/dots/:id/workspace` | your new `workspacePath` field |

### Delegating a task: the worktree contract

1. You choose **Send to dot** from chat, a failing test, an editor selection or the Dots view.
2. Dotwork runs `git worktree add ../.dotwork/<repo>-<dot>-<task> -b dot/<dot>/<task>` and records the base commit.
3. Dotwork sets the dot's workspace to that folder and sends a brief: goal, key files, test command, "don't run git, stay inside /workspace, write SUMMARY.md when done".
4. The dot works; risky actions raise approval cards that appear in Dotwork.
5. When the dot reports done (or SUMMARY.md appears), Dotwork commits in the worktree on the host and diffs it against the base commit.
6. **Dot Inbox** shows the proposal: summary, files changed, test result. You review per file in Monaco's diff editor.
7. Accept squash-merges into your branch; Reject removes the worktree and branch.

Gotcha: a worktree's `.git` is a file pointing at the main repo by absolute host path, so git fails inside Docker's `/workspace` mount. That is why Dotwork, not the dot, runs git.

### How dots concepts map

| OpenAI dots | Open Dot | Dotwork |
| --- | --- | --- |
| A primary dot you name | `createDot(name, purpose, look)` | Dots view, New dot |
| Its own cloud computer | cloud (E2B), docker or local computer | Worktree + Docker; link to Open Dot's computer view |
| Custom Rules (act, ask, hand off) | Rules: allow, ask first, never, checked by a small reviewer model | Rules editor |
| Approvals and auto-review | Approval cards: Approve, Deny, Always allow | Toasts + approval list |
| Scheduled tasks, proactive work | Cron routines | Routines editor; nightly test-and-fix template |
| Activity view | `/api/events` stream | Per-dot activity timeline |
| Brings you PRs to review | Not built in | Dot Inbox + diff review (your main contribution) |
| 4,000+ app plugins | Composio, 1,500+ apps | Not in v0.1; the dot keeps its own connections |

**Later adapters:** Hermes Agent via `hermes acp` (JSON-RPC over stdio); real OpenAI dots via a Dotwork MCP plugin with MCP Events and a public HTTPS relay.

## Security model

The renderer is treated as untrusted, keys live only in main, and a dot can never write to your working tree. Set these up on Day 2; retrofitting them later is painful.

- **Electron hardening.** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. The preload exposes one narrow typed API; every IPC payload is validated with zod. Add a Content-Security-Policy, block in-app navigation and `window.open`, and bundle Monaco locally.
- **Secrets.** API keys are encrypted with `safeStorage` in main, never sent to the renderer, masked in Settings and kept out of logs.
- **File access.** Every file operation resolves inside the open workspace root; reject paths that escape it with `..` or symlinks.
- **Dot isolation.** The dot edits only its worktree, preferably in Docker mode. The bridge listens on 127.0.0.1 only, behind a per-launch random token.
- **Default dot rules.** Installing packages, network calls and deleting files are set to "ask first" on first launch.
- **Untrusted output.** Text from dots, web pages and files is data. Dotwork never auto-runs a command found inside a proposal or a chat reply.

## 30-day roadmap

Four build weeks and a three-day launch, each week ending in a gate you can test in under five minutes. Every seventh day is a buffer; if a gate fails, spend the buffer on it and cut a should-have, never a gate.

&#91;embedded content: roadmap · 4 build weeks, launch, 5 gates\]

Each diamond is the gate that closes its week; the week's buffer day exists to make that gate pass.

### Week 1 (Oct 1–7): shell, editor, files

Gate: you can edit Dotwork's own README inside Dotwork.

- [ ] **Day 1, Oct 1 — de-risk Open Dot.** Clone it beside your project folder, note the commit SHA, run `pnpm install`, `npx playwright install chromium`, `pnpm dev`. Create a dot, send it a message, and watch events with `curl -N http://localhost:3100/api/events`. Open a GitHub issue asking for a LICENSE. On Windows, do this in WSL2.
- [ ] **Day 2 — scaffold.** `npm create @quick-start/electron@latest dotwork -- --template react-ts`. Add Tailwind, Zustand, codicons, zod. Set the security flags, a typed preload with one `ping` call, ESLint, Prettier, and a GitHub Actions job for lint, typecheck and tests.
- [ ] **Day 3 — layout.** Activity bar, sidebar, editor area, bottom panel and status bar with resizable panels. A command registry and the command palette.
- [ ] **Day 4 — workspace.** Open-folder dialog, recent folders, lazy file tree, chokidar watcher, create, rename, delete, path guard.
- [ ] **Day 5 — Monaco.** Bundle it locally with its web workers. One model per file URI, tabs, dirty markers, Ctrl+S, language by extension.
- [ ] **Day 6 — find things.** Quick open (Ctrl+P, fuzzy match) and a ripgrep search view that jumps to the line.
- [ ] **Day 7 — buffer.** Write ARCHITECTURE.md and a Playwright smoke test that launches the app and opens `fixtures/demo-repo`.

### Week 2 (Oct 8–14): terminal, git, AI chat

Gate: chat about the open file with at least two providers, one of them local Ollama.

- [ ] **Day 8 — terminal.** node-pty + xterm, rebuild node-pty for Electron (`npx @electron/rebuild -f -w node-pty`), multiple terminal tabs, resize, cwd at the workspace root.
- [ ] **Day 9 — git view.** Status, stage and unstage, Monaco diff editor for changes, commit box, branch name in the status bar.
- [ ] **Day 10 — settings and keys.** safeStorage secrets service, provider registry UI, a Test connection button per provider.
- [ ] **Day 11 — chat.** `streamText` in main, IPC streaming with abort, markdown rendering, Copy and Insert on code blocks, model picker.
- [ ] **Day 12 — context.** @file, @selection, @problems, @terminal, @diff, priority trimming, chips showing what is sent.
- [ ] **Day 13 — persistence.** Chat history per workspace in the app's data folder; verify the OpenAI-compatible path with Ollama.
- [ ] **Day 14 — buffer.** Vitest tests for the provider registry, context trimming and the path guard. Record a one-minute progress GIF.

### Week 3 (Oct 15–21): inline AI and the Open Dot bridge

Gate: message a dot from Dotwork, see its reply stream in, and approve one of its actions from a toast.

- [ ] **Day 15 — Ctrl+K inline edit.** Prompt widget over the selection, diff preview, accept and reject, undo-safe.
- [ ] **Day 16 — ghost text.** Inline completions provider with debounce, cancel, cache and a status-bar toggle.
- [ ] **Day 17 — bridge patch.** Write the bridge routes and the `workspacePath` override in your Open Dot clone, test each route with curl, export `patches/opendot-bridge.patch`.
- [ ] **Day 18 — adapters.** `DotProvider`, `MockDotProvider` with a scripted scenario, and the Open Dot adapter: sidecar launcher, health check, SSE client.
- [ ] **Day 19 — Dots view.** List and create dots, per-dot chat, status badges, pause and resume.
- [ ] **Day 20 — approvals.** Approval cards from events become toasts and a list; resolve them through the bridge.
- [ ] **Day 21 — buffer.**

### Week 4 (Oct 22–28): delegation, inbox, routines

Gate: the full Oct 31 demo runs end to end once, without restarting anything.

- [ ] **Day 22 — worktrees.** `proposals.ts`: create and remove worktrees, record the base commit, the task brief template, set the dot's workspace.
- [ ] **Day 23 — completion.** Detect done (dot message or SUMMARY.md), commit in the worktree, compute the diff, create a Proposal.
- [ ] **Day 24 — Dot Inbox.** Proposal list, per-file diff review, accept with squash merge, reject with cleanup.
- [ ] **Day 25 — Send to dot.** Entry points from terminal selection, editor selection and the Problems list.
- [ ] **Day 26 — rules and routines.** Simple forms for both, plus the nightly "run tests, propose fixes" template.
- [ ] **Day 27 — one should-have.** Pyright language server, agent mode, or IDE events that wake the dot.
- [ ] **Day 28 — buffer and bug bash.**

### Launch (Oct 29–31)

- [ ] **Day 29 — package.** electron-builder installer for your OS; CI builds for the other two if time allows.
- [ ] **Day 30 — tell the story.** README with GIFs, DEMO.md, a three-minute demo video, a short write-up of the dots integration.
- [ ] **Day 31 — release.** Tag v0.1.0, publish, label a few beginner-friendly issues. If this is your Hacktoberfest project, check this year's participation rules first.

## Testing and demo script

The mock dot provider makes the whole dots flow testable without Open Dot, an API key or a network. Build the fixture repo on Day 7 and use it for every test and the final demo.

**Fixture.** `fixtures/demo-repo`: a tiny Python package with three functions, a pytest suite, and one test that fails because of an off-by-one bug the dot can find.

**Unit tests (Vitest)**

- Provider registry: config to model, missing key errors
- Context builder: priority trimming stays under budget
- Path guard: rejects `..` and symlink escapes
- Proposals: create, commit, diff, accept and reject against a temporary git repo
- SSE mapping: Open Dot events become the right `DotEvent`s

**Integration.** `MockDotProvider` plays a script: reply, raise an approval card, edit a file in the worktree, report done. Assert that a proposal appears in Dot Inbox.

**End to end (Playwright Electron).** Launch, open the fixture, edit and save, delegate to the mock dot, accept the proposal, assert the file changed on disk.

**Live demo checklist (run on Days 28 and 30)**

1. Fresh launch; Open Dot sidecar shows green in the status bar.
2. Open the fixture; run `pytest` in the terminal; one test fails.
3. Chat explains the failing function; Ctrl+K refactors a helper.
4. Send the failure output to the dot; approve its `pip install` request.
5. Accept the proposal from Dot Inbox; rerun `pytest`; all green.
6. Show the nightly routine in the routines editor.

## Risks and mitigations

The two biggest risks are Open Dot itself and scope; both have a fallback decided now, so neither can sink the month.

| Risk | Early warning | Mitigation |
| --- | --- | --- |
| Scope creep, solo, 30 days | A gate is not met on its buffer day | Gates are fixed; cut should-haves first, then polish. Never skip the mock provider. |
| Open Dot never gets a license | No reply to your issue by Oct 21 | Keep it a separate install and your patch private; ship the Hermes adapter behind the same interface. |
| Open Dot changes or breaks (one-commit repo) | `pnpm dev` fails after a pull | Pin the SHA; only pull deliberately; develop against the mock. |
| Open Dot unstable on your OS | Day 1 spike fails | WSL2 on Windows; `local` mode if Docker is missing; switch to Hermes by end of Day 2 if still broken. |
| node-pty native build errors | Terminal crashes on launch | `@electron/rebuild`; mark node-pty as external in the Vite config. |
| Monaco workers misconfigured in Vite | No syntax colors, console worker errors | Follow the worker setup on Day 5; use a Monaco Vite plugin as a fallback. |
| Autocomplete costs run high | Provider dashboard spikes | Local model for completion; off by default for paid providers; show request counts. |
| A dot makes a bad or unsafe change | Odd diffs, surprising commands | Worktree isolation, review before merge, ask-first default rules, Docker mode. |

## Decision gates and open questions

These are the choices left open on purpose; each has a deadline so none of them stalls the build.

- [ ] **Oct 2:** Does Open Dot run on your OS? If not, switch to the Hermes adapter.
- [ ] **Oct 2:** Is Docker installed? Yes means `docker` mode for dots; no means `local` mode, which asks before every command.
- [ ] **Oct 8:** Which providers do you have keys for? Recommended: one cloud provider plus Ollama for free local autocomplete.
- [ ] **Oct 21:** Has Open Dot added a license? Decide whether to publish the bridge patch or open it as an upstream PR.
- [ ] **Oct 27:** Which should-have to build on Day 27.
- [ ] **Before Oct 31:** Final project name (Dotwork is a placeholder) and Dotwork's license (MIT recommended).

## Sources

- OpenAI, [Introducing dots](https://openai.com/index/introducing-dots/) (Sep 29, 2026)
- OpenAI, [DevDay 2026 Recap](https://openai.com/index/devday-2026-recap/)
- OpenAI Help Center, [Getting started with your dot](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)
- OpenAI, [Connect computers and apps to your dot](https://learn.chatgpt.com/docs/dots/computers-and-apps)
- OpenAI Developers, [MCP Events](https://developers.openai.com/plugins/build/mcp-events)
- OpenAI Developers, [Sign in with ChatGPT: ChatGPT plan usage](https://developers.openai.com/siwc/token-sharing-open-source)
- composio-community, [open-dot README](https://github.com/composio-community/open-dot), [package.json](https://github.com/composio-community/open-dot/blob/main/package.json), [actions.ts](https://github.com/composio-community/open-dot/blob/main/src/app/actions.ts), [computer/index.ts](https://github.com/composio-community/open-dot/blob/main/src/server/computer/index.ts), [vault.ts](https://github.com/composio-community/open-dot/blob/main/src/server/vault.ts)
- Nous Research, [Hermes Agent: Programmatic Integration](https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration)
