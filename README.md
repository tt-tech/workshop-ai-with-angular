# AI with Angular — workshop repository

Demo workspace for the **AI with Angular** workshop (tt-tech.io). Web banking for *Atlas Bank*, an invented Moroccan bank: accounts and transactions, cards, requests, and a frozen legacy transfers module waiting to be migrated. Every exercise in the workshop runs on this codebase.

- Angular 22 · Nx · standalone components + signals · Vitest
- Architecture enforced by ESLint module boundaries (and, for non-Nx teams, the same contract in `sheriff.config.ts`)
- Agent guidance in one place: `AGENTS.md`. Tool-specific files only point to it.

## Run

```bash
npm install
npm start            # http://localhost:4200
npm run test
npm run lint:arch    # boundaries + house rules
npm run typecheck
```

## Layout

```
apps/atlas                     shell + routes only
libs/domain                   pure TS: models, canTransfer(), formatRib(), formatMad()
libs/data-access/banking      FakeBackend (the boundary) + AccountsStore, CardsStore, RequestsStore (signals)
libs/ui                       StatusBadge, PageHeader, Amount, MadPipe (presentational)
libs/feature/dashboard        overview route
libs/feature/accounts         list + detail routes
libs/feature/requests         list route
libs/legacy/transfers         NgModule + *ngIf + constructor DI + any — the module-2 migration target
docs/tasks                    task-file template + example task
exercises                     one file per workshop module
```

## Exercises

| Module | File | Git tags used |
|---|---|---|
| 1 — AI-assisted workflow | `exercises/m1-ai-assisted-workflow.md` | `m1-unconstrained`, `m1-with-rules` |
| 2 — Modernising legacy Angular with agents | *(coming)* | |
| 3 — Building an AI feature | *(coming)* | |

## Licence

MIT. Invented data; no real bank, customer or client code.
