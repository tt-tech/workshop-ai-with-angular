# Atlas Bank — rules for coding agents

Read this first. The tool-specific files (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, `GEMINI.md`) only point here. One source of truth, any agent.

## What this is

Web banking for **Atlas Bank**, an imaginary Moroccan bank. A customer sees accounts and transactions, cards and requests, and makes transfers. Nx monorepo, Angular 22, standalone components + signals, Vitest. Everything here is demo data.

## Layout and boundaries (enforced: `npm run lint:arch`)

| Path                 | What                                                                    | May import              |
| -------------------- | ----------------------------------------------------------------------- | ----------------------- |
| `libs/domain`        | pure TypeScript models + pure functions, **no Angular imports**         | nothing                 |
| `libs/data-access/*` | stores (signals) and services; the only place that talks to the backend | domain                  |
| `libs/ui`            | presentational components: inputs/outputs only                          | domain                  |
| `libs/feature/*`     | routed features that wire ui + data-access                              | ui, data-access, domain |
| `libs/legacy/*`      | **frozen** NgModule code being migrated — wrap it, don't extend it      | data-access, domain     |
| `apps/atlas`         | shell and routes only, no business logic                                | everything above        |

The app is **zoneless** (Angular's default). Never add `zone.js`. Legacy code in `libs/legacy` calls `ChangeDetectorRef.markForCheck()` after its manual subscriptions; that is a smell to migrate, not a pattern to copy.

Cross-lib imports go through the `@atlas/*` aliases only, never relative paths into another lib. A lib's `src/index.ts` exports what consumers mount plus contract types; internals stay unexported.

## Skills (layered guidance)

1. **Official Angular skills** (`.agents/skills/angular-developer`, `angular-new-app`, installed with `npx skills add https://github.com/angular/skills`) and the Nx skills — the baseline, kept current upstream.
2. **`atlas-conventions`** (`.agents/skills/atlas-conventions/SKILL.md`) — the short diff where this repo is stricter or differs (v22 defaults such as OnPush and zoneless are never restated in code, store shape, test pattern, naming). **Where the two disagree, `atlas-conventions` and this file win.**
3. Your personal rules on top.

## Non-negotiables

- New components are **standalone**, use **signals**, `inject()`, `input()`/`output()`, and the new control flow (`@if`, `@for`). No new NgModules. No `*ngIf`/`*ngFor` outside `libs/legacy`. OnPush is Angular's default since v22 — never write `changeDetection:` on a component, and never opt into `Eager`.
- **Never edit `libs/legacy/**`** unless the task file says `migrate`. Wrap it. A task file that asks for pinning tests allows new `*.spec.ts` files there, nothing else.
- Crossing a library boundary needs an ADR link in the PR.
- No `any`. No defensive guards for states no caller can produce — express the invariant.
- `computed` over `effect`. Never set state inside an `effect` when a `computed` can derive it. Don't short-circuit signal reads (`a() || b()` hides `b` from tracking).
- Services expose signals or Observables; they **never subscribe to themselves**. Components don't `.subscribe()` for view data.
- Name every magic value as a module-level `const`. Grep `libs/domain` before adding one — it usually exists.
- Find the closest existing analogue (a sibling component or store) and mirror its shape. Justify deviations in the PR description, not in code comments.
- Touch a shared signature → update every caller in the same change.
- No rationale comments in code. `// TODO` must reference a task id: `// TODO 007: ...`.

## Tests

- A test is triggered by a **requirement**, not by the existence of a class. Test through the public API or the DOM, never implementation details.
- Real collaborators inside the unit; test doubles only at the boundary (`FakeBackend` in `@atlas/data-access-banking`). Never mock a store to test a component that uses it.
- No `setTimeout` / sleeps in tests. Use `await fixture.whenStable()` or assert store state.
- Expected values are hardcoded from the requirement: never recomputed by the code under test (`blockerMessage[...]`, `formatMad(...)`), never copied from the current output. Pinning tests (task 000) record the current output on purpose.
- An assertion that already passes on first render, before any action, proves nothing. Assert what the action changed.
- A console error in a green run is a failure. Read the console; never silence it.
- **Never edit existing assertions to make a diff pass.** If an assertion is wrong, say so in the PR and stop.

## Styles (design tokens are the contract)

- **No raw colour outside the tokens.** Read `--color-*` by role (`--color-surface`, `--color-text-muted`, `--color-credit`); the palette lives only in `apps/atlas/src/styles/tokens`. A new role is a new token there, with light and dark values, not a hex in a component. `npm run check:tokens` (part of `lint:arch`) fails on `#hex`, `rgb()`, `hsl()` elsewhere. `libs/legacy` is exempt until it is deleted.
- **Use what exists before adding CSS.** Global layers in `apps/atlas/src/styles`: `.card`, `.button` (`--ghost`, `--quiet`, `--block`), `.field`, `.table`, `.alert`, and utilities (`.muted`, `.small`, `.mono`, `.num`, `.strong`). Component styles only for layout specific to that screen.
- **Money is tabular and right-aligned** (`.num` or `<atlas-amount>`); never format MAD by hand, use `formatMad` / the `mad` pipe.
- **A restyle never changes the flow.** Labels, button names and `role=alert` messages are what the URL tests read; keep them, and the tests pass unchanged.

## Security (module 5: AI as the attacker, AI as the reviewer)

- **Never bypass the sanitizer.** No `bypassSecurityTrust*`, no HTML built from user input. Render text; if a subset of markup is wanted, map it to elements in the template (see `label-format.ts`). Lint fails on a bypass.
- **No secret in client code.** No API key, token or password in `apps/` or `libs/`, not even "temporarily". `npm run scan:secrets` fails the build on anything that looks like one. Keys live behind the backend.
- **The browser never calls a third party.** Every outside service goes through the backend (`FakeBackend` here, your API in production). Lint fails on a direct `fetch` to an absolute URL.
- **Every business rule is enforced at the boundary.** The client check (`canTransfer()` in a component) is for the user's screen; the same rule runs in the backend for real. A product request to relax a rule changes the domain and the backend, never a component. "Only the client checks it" is a finding, not a shortcut.
- **Authorisation before data.** Data reaches a model or a screen as the signed-in user, with that user's rights, never through a service account "for convenience".
- **Scan every agent diff before a human reads it:** `npm run lint:arch` (the cheap layer) and the model-based security scan (`/claude-security` on the diff, or your tool's equivalent). Findings go into the PR, fixed or explicitly accepted.

## Before you say you are done

1. `npm run lint:arch` passes (boundaries, house rules, secrets scan)
2. `npm run test` passes **without changed assertions**
3. `npm run typecheck` passes
4. The diff is **≤ 300 lines** unless the task file raises the limit
5. List the commands you ran and their results

## Task files

Every non-trivial task starts from a task file: copy `docs/tasks/TEMPLATE.md` to `docs/tasks/<id>-<slug>.md`, fill scope / out of scope / done-when / size limit, then work from it. If the task has no file, ask for one before writing code.
