# AI with Angular — workshop repository

Demo workspace for the **AI with Angular** workshop (tt-tech.io). A customer-atlas back office for *Atlas Telecom*, an invented mobile operator: subscribers, plans, tickets, and a frozen legacy corner waiting to be migrated. Every exercise in the workshop runs on this codebase.

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
libs/domain                   pure TS: models, canChangePlan(), formatMsisdn()
libs/data-access/subscribers  FakeBackend (the boundary) + SubscribersStore, TicketsStore (signals)
libs/ui                       StatusBadge, PageHeader (presentational)
libs/feature/subscribers      list + detail routes
libs/feature/tickets          list route
libs/legacy/plans             NgModule + *ngIf + constructor DI + any — the module-2 migration target
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

MIT. Invented data; no real operator, customer or client code.
