---
name: atlas-conventions
description: Repo-specific Angular conventions for the Atlas Bank workshop workspace — the 40-line diff on top of the official angular-developer skill. Use whenever creating or editing a component, store, or test in this repo; where this file and the official Angular skill disagree, this file wins.
---

# Atlas Bank conventions (the diff on top of the official Angular skill)

The official `angular-developer` skill is installed and is the baseline. This skill only lists where this repo deliberately differs or is stricter. Everything else: follow the official skill and `AGENTS.md`.

## Angular 22 defaults we rely on — do not restate them in code

- **OnPush is the default change detection.** Never write `changeDetection: ChangeDetectionStrategy.OnPush` on a component; it is noise. Never opt into `ChangeDetectionStrategy.Eager`.
- **Zoneless is the default.** There is no `zone.js` in this workspace and it must not be added. Async work must land in a signal (`set`/`update`) or, in `libs/legacy` only, call `markForCheck()`.
- **Standalone is the default.** Never write `standalone: true`; never create an `NgModule` outside `libs/legacy`.
- **Signal inputs/outputs.** `input()`, `input.required()`, `output()`, `model()`. No `@Input()`/`@Output()` decorators.
- **`inject()` only.** No constructor parameter injection outside `libs/legacy`.
- **Control flow.** `@if` / `@for` (with `track`) / `@switch` / `@let`. No `*ngIf` / `*ngFor` outside `libs/legacy`.

## Stores

- A store is an `@Injectable({ providedIn: 'root' })` class holding private `signal`s and exposing `asReadonly()` views plus `computed`s. No NgRx, no SignalStore library, no `BehaviorSubject` singletons.
- `load()` is idempotent while in flight (share one promise). Mirror `AccountsStore`.
- The only class that talks to "the server" is `FakeBackend` in `@atlas/data-access-banking`.

## Tests

- Sociable: real stores participate; replace only `FakeBackend` (`{ provide: FakeBackend, useClass: InstantBackend }`).
- After `fixture.detectChanges()` starts a load, `await TestBed.inject(SomeStore).load()` — it resolves with the component's own load — then `detectChanges()` again. No `whenStable()` gambling, no sleeps.
- Assert hardcoded strings (`'1 250,50 MAD'`); `formatMad` is deterministic on purpose.

## Naming

- Files: `account-list.ts`, class `AccountList` (no `.component` suffix, per the Angular 20+ style guide). Legacy keeps its old `*.component.ts` names untouched.
- Selectors: `atlas-` prefix, kebab-case.
- Constants: module-level camelCase `const` (`allCategories`, `recentCount`), never inline literals.

## Before you finish

`npm run lint:arch && npm run test && npm run typecheck`, diff ≤ 300 lines, task file referenced. See `AGENTS.md`.
