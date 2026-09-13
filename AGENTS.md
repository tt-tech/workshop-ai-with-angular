# Atlas — rules for coding agents

Read this first. The tool-specific files (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, `GEMINI.md`) only point here. One source of truth, any agent.

## What this is

Web banking for **Atlas Bank**, an invented Moroccan bank. A customer sees accounts and transactions, cards and requests, and makes transfers. Nx monorepo, Angular 22, standalone components + signals, Vitest. Everything here is demo data.

## Layout and boundaries (enforced: `npm run lint:arch`)

| Path | What | May import |
|---|---|---|
| `libs/domain` | pure TypeScript models + pure functions, **no Angular imports** | nothing |
| `libs/data-access/*` | stores (signals) and services; the only place that talks to the backend | domain |
| `libs/ui` | presentational components: inputs/outputs only | domain |
| `libs/feature/*` | routed features that wire ui + data-access | ui, data-access, domain |
| `libs/legacy/*` | **frozen** NgModule code being migrated — wrap it, don't extend it | data-access, domain |
| `apps/atlas` | shell and routes only, no business logic | everything above |

The app is **zoneless** (Angular's default). Never add `zone.js`. Legacy code in `libs/legacy` calls `ChangeDetectorRef.markForCheck()` after its manual subscriptions; that is a smell to migrate, not a pattern to copy.

Cross-lib imports go through the `@atlas/*` aliases only, never relative paths into another lib. A lib's `src/index.ts` exports what consumers mount plus contract types; internals stay unexported.

## Non-negotiables

- New components are **standalone**, use **signals**, `inject()`, `input()`/`output()`, and the new control flow (`@if`, `@for`). No new NgModules. No `*ngIf`/`*ngFor` outside `libs/legacy`. OnPush is Angular's default since v22 — never write `changeDetection:` on a component, and never opt into `Eager`.
- **Never edit `libs/legacy/**`** unless the task file says `migrate`. Wrap it.
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
- **Never edit existing assertions to make a diff pass.** If an assertion is wrong, say so in the PR and stop.

## Before you say you are done

1. `npm run lint:arch` passes (boundaries + house rules)
2. `npm run test` passes **without changed assertions**
3. `npm run typecheck` passes
4. The diff is **≤ 300 lines** unless the task file raises the limit
5. List the commands you ran and their results

## Task files

Every non-trivial task starts from a task file: copy `docs/tasks/TEMPLATE.md` to `docs/tasks/<id>-<slug>.md`, fill scope / out of scope / done-when / size limit, then work from it. If the task has no file, ask for one before writing code.
