# Task 008: Generative dashboard (A2UI) on the assistant page

## Goal

On `/assistant` the customer types a question, picks Claude or GPT, and gets an answer drawn as UI (account card, spending bars, transactions) from a locked A2UI catalog, filled by the server with the customer's own data.

## Scope

- Allowed to change: `apps/atlas` (one route, dev proxy, CSP meta), `libs/domain` (one constant: `assistantCatalogId`, shared by the page and the server), `tsconfig.base.json` (two aliases), `package.json` (SDKs, scripts, typecheck)
- New files allowed in: `libs/feature/assistant`, `libs/data-access/assistant`, `apps/assistant-api`, `docs/generative-ui.md`

## Out of scope

- `libs/ui`, `libs/data-access/banking`, other features, anything in `libs/legacy`
- The nav rail: `app.spec.ts` pins its links, so the route is reachable by URL only
- Any action that moves money; streaming; conversation history sent to the model

## Done when

- [ ] `npm run lint:arch` passes
- [ ] `npm run test` passes without changed assertions
- [ ] `npm run typecheck` passes (now also typechecks `apps/assistant-api`)
- [ ] With `npm run assistant:api:fake` running, `/assistant` → "Send" shows the current account card (`18 642,35 MAD`), September spending bars and three transactions; "Show recent transactions" replaces it with the five latest
- [ ] A macro on another customer's account (`a-youssef`) renders an error card, never data
- [ ] The prompt sent to the model holds no balance, amount, account number or customer name (spec in `apps/assistant-api`)
- [ ] Model-written nodes pass a strict allow-list: layout and digit-free text only (no `\p{N}` or `\p{Sc}` after NFKC), no Image/Video/Icon/List, no bindings, functions or URLs; the model's `dataModel` is ignored
- [ ] The expanded answer is a tree: at most 200 nodes, unique ids, existing children each referenced once, all reachable from `root`, no model reference into a macro's `__` ids; otherwise one error card (specs reproduce each review probe)
- [ ] Error cards use fixed messages; details only in the server log
- [ ] Model calls time out after 30 s and cap output at 4000 tokens; failures are a generic 502
- [ ] Diff ≤ 1600 lines excluding `package-lock.json`: a new feature lib, a data-access lib and a small server each carry their own config files (first pass ≈1170); two review rounds of security fixes (allow-list, digit rule, tree check, HTTP hardening, backend seam) and their specs add the rest

## Known gaps

- `feature-assistant`'s spec prints "Lit is in dev mode" on stderr (a warning, not an error). Lit's export map serves `development` and Vitest keeps that condition; `resolve.conditions`, `ssr.resolve.conditions` and `environments.*.resolve.conditions` set to `production` all failed. Aliasing Lit's files was not done on purpose.
- Numbers written as words ("eighteen thousand dirhams") pass the digit rule; only the system prompt asks the model not to. A word list would be the same losing game as the old money regex.
- A2UI's `Text` logs "can't render markdown because no markdown renderer is configured" once. Kept on purpose: a markdown renderer's output goes in as raw HTML (`unsafeHTML`) and the renderer must sanitise it; without one, model text stays escaped plain text.
- `connect-src` is not in the CSP: it would need the dev server's websocket listed and is not needed for the probe the review found (`img-src` covers it).

## Notes for the agent

- Closest analogue to mirror: `libs/feature/requests` (lib shape), `RequestsStore` (store shape)
- Domain to reuse: `maskRib`, `categoryLabel`, `Account`, `Transaction` from `@atlas/domain`; money on screen via `<atlas-amount>` / `mad`
- Renderer: `@a2ui/angular` root entry (protocol v1.0), `provideA2UI` + `A2uiRendererService` on the route, `BasicCatalogBase` with `extraComponents`

## Theme note

A2UI injects an unlayered `:where(:root) { color-scheme: light dark }`. Atlas tokens live in `@layer tokens`, and unlayered rules beat layered ones, so native controls followed the OS instead of the theme toggle. `styles.scss` now sets `color-scheme` unlayered, mirroring the token rules. The assistant page maps the `--a2ui-color-*` variables to Atlas tokens.

## Nav link (Adil, 2026-11-14)

The owner asked for the assistant in the main menu. That is a changed requirement, so `app.spec.ts` now expects the extra "Assistant" link; no other assertion changed. The "AI" badge is a CSS pseudo-element, so the link text stays "Assistant".

## Server trace (Adil, 2026-11-14)

For the video the owner wants the server log on screen. `AssistantDeps` gets a `trace` next to `log`: one line in (model and question), one line with what the model placed (component names and account ids only, never an amount), and one line out (shown or N blocked, and the time). `log` stays as it was, so the existing log assertions are unchanged.

## Server layout (Adil, 2026-11-14)

The owner found `macros.ts` and `assistant.ts` hard to read: one file held five jobs. Pure move, same behaviour, no assertion changed (only the spec's import paths):

- `gate/`: the server gate. `gate.ts` (`passGate`) is the entry point; `model-components.ts` (what the model may place), `macro.ts` (`defineMacro`, `bind`), `macros/` (one macro per file), `macro-registry.ts`, `tree.ts`, `blocked.ts`.
- `assistant/`: `assistant.ts` (`ask`, `act`), `system-prompt.ts`, `trace.ts`.
- `models/`: `model-client.ts` (the interface), `claude-client.ts`, `gpt-client.ts`, `scripted-model-client.ts` (scripted replies and the compromised model), `model-for.ts`, `upstream-error.ts`.
- `a2ui/`: `protocol.ts` (version, ids, schemas), `read-model-reply.ts`, `surface-messages.ts`.
- `http/`: `server.ts` (routes), `request-guard.ts`, `read-json.ts`, `problems.ts`.

After an independent architecture review: one id rule (`idSchema`, the `__` separator and `serverId` in `a2ui/protocol.ts`) replaces the separate model-reference check; the `show_transactions` event is defined once; the figure rule is matched by a zod param, not by its message; `root` and `BlockedNotice` are named constants; prompt text moved out of `bank.ts`; request failures go through the injected log with their cause chain. A child pointing at `root` now logs "root is referenced as a child" (it said "referenced more than once"); no test asserted the old reason.

## Angular review round (Adil, 2026-11-14)

An independent Angular review of the page, store, catalog and styles. Applied:

- Render failures were lost: the page fed replies to the renderer in an `effect`, and a processing error went to the `ErrorHandler`, leaving an empty answer. The store now calls `processMessagesAsync` inside its `try`, so the error lands in `role=alert`. For that the store is provided on the route, next to `A2uiRendererService` (a deviation from root-provided stores: the store needs the route's renderer). The action handler resolves the store lazily, which breaks the store, renderer config, store cycle.
- The wire contract lives in `@atlas/domain` (`assistantComponents`, `showTransactions`, `SpendingBar`, `TransactionRow`), used by the catalog and by the server. The server returns `surfaceId` in the reply; the store no longer digs it out of the messages.
- The store holds one reply, not an unused chat history. `assistantModels` (with the key label) lives next to the `AssistantModel` type; the scenarios live in `scenarios.ts`. "Spending this month" became "Spending in September" to match the prompt.
- The backend uses `HttpClient` (`provideHttpClient(withFetch())`) and maps an error body or a bare status to a message. Deviation from "only `FakeBackend` talks to the server": the assistant needs a real model behind a real server; the browser still talks only to our own `/api`.
- Catalog components decode bound values with one zod helper (`catalog/bound-value.ts`), no casts.
- Styles: `color-scheme` is emitted once by `theme.color-scheme`, unlayered, because the A2UI renderer injects an unlayered `:where(:root) { color-scheme: light dark }` that beats any layered rule. The `--a2ui-color-*` bridge moved to `styles/components/_a2ui.scss` (`.a2ui-theme`). `textarea` joined the global field styles (it now gets the focus ring). The AI badge has empty alt text (`content: 'AI' / ''`), so the link's accessible name stays "Assistant".
- `aria-live` sits on an element that is always present.

Page spec, rewritten (these tests are new on this branch): the action round trip, the typed key, and a renderer failure now have tests; the error test asserts the earlier answer is gone. The spec keeps TestBed injectors alive between tests (`teardown: { destroyAfterEach: false }`): `@a2ui/angular` binds its signal effects once per process to the first injector it sees (`initializeAngularReactivity`, guarded by a module flag), so a destroyed TestBed broke every later test.

API key field: optional, per model, kept in the store's memory only, sent with `/api/assistant`, trimmed and capped at 300 characters by the server, passed to the model client for that request only; a spec proves it never reaches the log or the trace.

Not done: Prettier (the repo is not Prettier-formatted, `main` included); `clientFor` stays a parameter of `ask`.

## Server log in the page (Adil, 2026-11-14)

For the video the owner wanted the server log next to the answer. With `ATLAS_SHOW_TRACE=1` (on in the `fake` and `own-key` scripts, off otherwise) each reply carries that request's trace as `ServerTraceLine[]` (`@atlas/domain`), and the page shows it under the answer, blocked lines in red. The console output is unchanged: `requestTrace` writes to the injected `trace`/`log` and keeps a copy per request. Off by default, because sending the server's reasons to the browser is a demo choice, not a production one.
