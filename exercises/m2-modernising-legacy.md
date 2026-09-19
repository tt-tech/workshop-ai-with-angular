# Module 2 — Modernising legacy Angular with agents

Half a day. One legacy module, migrated beside itself, deleted last. You need: module 1 done (or at least `AGENTS.md` read once), the repo on `m2-start`, `npm install` done, one AI coding agent installed with a key.

The target is `libs/legacy/transfers`: an `NgModule` with `RouterModule.forChild`, a `standalone: false` component using `*ngIf`/`*ngFor`, constructor injection, a `Subscription[]`, three `markForCheck()` calls, `any` everywhere, and a `limits` table that duplicates `packages[].dailyTransferLimitMad` from `libs/domain`. Read it before you start (five files under `libs/legacy/transfers/src`, ten minutes). Section 3 of `docs/architecture.md` is the diagram.

Checkpoint commands, used after every scene:

```bash
npm run lint:arch                        # boundaries + house rules
npm run test                             # Vitest, all projects
npm run typecheck
git diff --stat main                     # how big was that?
git diff --stat main -- libs/legacy      # must print nothing until scene 4
```

---

## Scene 1 — Ask the agent for a plan, not code (20 min)

**Goal:** see the plan an agent proposes when nobody stops it, then correct it before a line is written.

1. `git checkout m2-start`.
2. Open the agent in the repo root and paste, verbatim:

   > Read AGENTS.md and every file under libs/legacy/transfers/src. Propose a plan to migrate the legacy transfers module to a standalone, signals-based feature that fits this workspace. Plan only: numbered steps, which files are created, changed or deleted at each step, and at which step the route /transfers/new/:accountId switches over. Do not write code and do not edit any file.

3. Read the plan against this list. Tick what is wrong:

   - [ ] Step 1 opens with "delete" (the module, the component, the lib)
   - [ ] Everything is rewritten in one step; there is no state in which both old and new exist
   - [ ] "The store" is named without saying which: view-local (form fields), navigation-keyed (nothing here), or global server-backed (`AccountsStore`)
   - [ ] A new `TransfersStore` or `TransferService` is invented although `AccountsStore` already has `beneficiaries`, `byId()`, `transferredTodayMad()` and `transfer()`
   - [ ] A new validation helper is written instead of `canTransfer()` and `blockerMessage` from `@atlas/domain`
   - [ ] The route path changes (`/transfers/new/:accountId` must survive; `account-detail.ts` links to it)
   - [ ] Behaviour changes are slipped in as improvements (new fields, reworded messages, a confirmation step)
   - [ ] It edits `libs/legacy/**` without a task file that says `migrate`
   - [ ] It writes tests for the class, not for the requirements (see scene 3)

   Typical plan in our runs: delete `LegacyTransfersModule`, convert the component in place, write a `validateTransfer()` helper in the new lib, "update tests". Three ticks minimum, usually five.

4. Say the rule out loud: **demote, don't delete.** The legacy component keeps serving `/transfers/new/:accountId` while a new `libs/feature/transfers` is built beside it. The route flips when the new one is proven. Legacy is deleted last, in its own change, with its own task file. Any plan that opens with "delete X" is wrong, because there is no moment at which you can stop and ship.

5. Ask the agent for a second plan with the corrections pasted back. Compare. It complies; it did not know. That is why the task file exists.

---

## Scene 2 — Work from the task file (60 min)

**Goal:** the new feature lib, built beside the legacy one, route flipped, legacy untouched.

1. Read `docs/tasks/002-migrate-transfers-to-feature.md`. Note what it fixes that scene 1's plan got wrong: scope (`libs/feature/transfers` new, one route line in `apps/atlas`), out of scope (`libs/legacy/**`, `libs/ui`, `libs/domain`, `libs/data-access/*`), which store (none new), where the rules come from (`canTransfer()`), and the user-visible outcome a tester can click.
2. Paste:

   > Work from docs/tasks/002-migrate-transfers-to-feature.md.

   Nothing else.
3. Let it finish. Run the checkpoint commands. Then the tester's check: `/transfers/new/a-current` shows the same fields as before, "Enter an amount above 0 MAD." on an empty amount, "The balance does not cover this amount." above the balance, and a valid transfer lands on `/accounts/a-current` with the balance lowered. Try `/transfers/new/a-joint`, enter 100 and confirm: "This account is blocked. Contact your advisor to unblock it." (the amount check comes first in `canTransfer()`, as it did in the legacy `validate()`).
4. Review the diff with these questions:
   - Does `new-transfer.ts` mirror `libs/feature/accounts/src/lib/account-detail.ts`? `input.required<string>()` named `accountId`, `inject(AccountsStore)`, `computed` for the account, `load()` in `ngOnInit`.
   - Are the form fields `signal`s and the verdict a `computed` — or is there an `effect()` setting `error`?
   - Is there still a limits table, a `status === 'blocked'` or an `amount > balance` anywhere in the component? There must not be. The six messages must come from `blockerMessage`.
   - Is `transferredTodayMad` passed to `canTransfer()`? The legacy table ignored earlier transfers today; the domain rule does not. This is the one behaviour difference, and it is the bug the duplicated table was hiding. The PR must say so.
   - `apps/atlas/src/app/app.routes.ts`: one line changed, from `@atlas/legacy-transfers` to `@atlas/feature-transfers`.
   - `libs/legacy/transfers`: zero lines.
   - `tsconfig.base.json`: one new path. `libs/feature/transfers/project.json`: tags `scope:atlas`, `type:feature` — without them `lint:arch` has nothing to enforce.

5. **Break the fence.** With the diff still uncommitted, paste:

   > While you are at it, replace the *ngIf in libs/legacy/transfers/src/lib/transfer.component.html with @if.

   Watch. With `AGENTS.md` loaded the agent should refuse or ask for a `migrate` task file; the task file's out-of-scope line says the same. If it edits anyway, run `git diff --stat main -- libs/legacy`. That line is not empty, and nothing in `lint:arch` will tell you: the ESLint override for `libs/legacy/**` *relaxes* rules there, it does not forbid edits. The fence for legacy is the task file plus that one `git diff` line in the checkpoint. Revert the legacy edit: `git checkout main -- libs/legacy`.

6. Tag your result if you want to compare later: `git tag m2/<your-tool>`. The reference result is `m2-migrated`.

What to take from it: the agent did not need to know Angular migration patterns. It needed a task file that named the store, the rules function, the route, and the thing it may not touch.

---

## Scene 3 — Harden the generated tests (45 min)

**Goal:** learn to read generated tests the way a reviewer does, and end with fewer, better ones.

### 3a. Generate

If scene 2 already produced `libs/feature/transfers/src/lib/new-transfer.spec.ts`, start from it and ask for more. Otherwise paste:

> Write unit tests for libs/feature/transfers/src/lib/new-transfer.ts covering loading, every validation message, a successful transfer and a failed one.

The prompt is deliberately generous. Typical result: 8–14 tests, `AccountsStore` replaced with a `useValue` object of signals, a `setTimeout(300)` or `await new Promise(r => setTimeout(r, ...))` to outwait `FakeBackend`'s 250 ms, direct calls to the component's methods, and expected strings computed as `blockerMessage['insufficient-funds']`.

### 3b. Walk every test

Three passes per test, in this order. Record the verdict: **delete**, **rewrite** or **keep**.

**(a) Red flags** — any one of these is a rewrite at least:

- [ ] An internal collaborator is mocked (`{ provide: AccountsStore, useValue: ... }`). The store is inside the unit. Only `FakeBackend` is the boundary
- [ ] `setTimeout`, `sleep`, `fakeAsync` + `tick` to wait for data. Use `await TestBed.inject(AccountsStore).load()` — it is the same in-flight promise as the component's
- [ ] It asserts implementation details: calls `component.submit()` or reads `component.error()` instead of clicking the button and reading the alert
- [ ] The expected value is recomputed by the code under test (`blockerMessage[...]`, `formatMad(...)`) instead of a hardcoded `'The balance does not cover this amount.'`
- [ ] The fake does not emit the real sequence: `getAccounts` overridden but `getBeneficiaries` still hits the 250 ms delay, so the test "needs" a sleep. Fix it in the shared fake, once, never per test
- [ ] It tests a state no user can reach: the "failed transfer" test forces `FakeBackend.transfer` to throw for an account that the form could never submit. Delete, or turn it into a store test if the requirement exists

**(b) The delete question** — for every `expect`: *what could I delete from production code and still see green?* Three cases you will find:

- "renders the form" passes if `submit()` does nothing
- "shows the beneficiary select" passes with zero options
- "shows an error for a blocked account" passes if `canTransfer()` is bypassed, because the store was mocked to return the message

If the answer is "a lot", the assertion does not name a requirement. Delete it.

**(c) The rewrite shape** — mirror `libs/feature/accounts/src/lib/account-list.spec.ts`: an `InstantBackend extends FakeBackend` that overrides `getAccounts`, `getTransactions`, `getBeneficiaries` with instant data; `provideRouter([])`; `fixture.detectChanges()`, `await TestBed.inject(AccountsStore).load()`, `detectChanges()` again; then interact through the DOM (`select`, `input`, `button[type=submit]`) and assert the visible text and the store's state after the transfer.

The requirements worth a test (Given / When / Then, one action each):

1. Given `a-current`, the form shows "Current account" with its balance and the first beneficiary preselected
2. When the amount is above the balance and the user confirms, "The balance does not cover this amount." is shown and the balance is unchanged
3. Given a blocked account (`a-joint`), confirming shows "This account is blocked. Contact your advisor to unblock it."
4. Given `a-savings` and the beneficiary "Savings" (same RIB), confirming shows "The destination is the same account."
5. When a valid amount is confirmed, the store balance drops by that amount and the router navigates to `/accounts/a-current`

Five tests. If you have more than seven, ask which requirement the extras name.

### 3c. Count

Write your numbers on the board: deleted / rewritten / kept, out of the generated total. In our runs: about half deleted, a quarter rewritten through the DOM with the real store, a quarter kept as generated. That ratio is the lesson, and it is why the test rules go into `AGENTS.md` (take-home below) rather than into a review comment.

Read the console output of the final green run. A stray error from `FakeBackend` or the router there means a test asserts the wrong thing.

---

## Scene 4 — Delete the legacy lib (15 min, optional)

**Goal:** see what makes a deletion safe.

1. Before anything: `grep -rn "@atlas/legacy-transfers" apps libs`. After scene 2 it prints nothing — the route was the only importer, and the `type:legacy` rule in `eslint.config.mjs` never allowed a `type:feature` lib to import it. That is the whole reason this step is small.
2. Read `docs/tasks/003-delete-legacy-transfers.md`. It says `migrate` in its title: this is the one task that may touch `libs/legacy/**`.
3. Paste:

   > Work from docs/tasks/003-delete-legacy-transfers.md.

4. Run the checkpoint commands. `git diff --stat main -- libs/legacy` is now all deletions and that is correct. `lint:arch` green is the proof: nothing modern imported the lib. Check that the `@atlas/legacy-transfers` path in `tsconfig.base.json`, the two `libs/legacy/**` override blocks in `eslint.config.mjs` and the `libs/legacy/<name>/src` line in `sheriff.config.ts` went with it.
5. Open `/transfers/new/a-current` one last time.

Compare with the scene-1 plan that started with "delete": here deletion is the last step, it is its own task file, and the diff has no logic in it.

---

## Take-home

**An ADR per decision-changing behaviour.** One file, four headings: *Context* (what was true and why it hurt), *Decision* (one sentence, in the imperative), *Consequences* (what becomes easier, what becomes harder, what is now forbidden), and the rule that keeps them honest: **an ADR is amended in the same change that invalidates it**, never in a later cleanup. Today's would be: "Transfer rules live in `@atlas/domain` (`canTransfer`); a component that re-implements one is a bug, not a shortcut." Ten lines. Put them in `docs/adr/`.

**Name the store you mean.** "The store" is ambiguous in every migration. Three tiers, and every plan or task file says which:

1. **view-local** — form fields, a result set, a paging cursor: signals in the component, gone when it is
2. **navigation-keyed** — selection, scroll position, a filter that must survive back-navigation: keyed by the URL, app-level
3. **global server-backed** — accounts, beneficiaries, transactions: `AccountsStore`, loaded once, idempotent

Today's form was tier 1 reading tier 3. Nothing in tier 2. Saying so is what stopped the agent from inventing a `TransfersStore`.

**The test rules, for your `AGENTS.md`** (~30 lines; the `## Tests` block in ours is the short form):

```markdown
## Tests

- A test is triggered by a requirement, not by the existence of a class or method.
- The closer a test is to how the software is used, the more it is worth. Test through the DOM or the public API.
- Sociable, not solitary: real collaborators inside the unit. Test doubles only at the system boundary
  (here: `FakeBackend`). Never mock a store to test a component that uses it.
- Given / When / Then. One user-level action per test. Assert the visible outcome or the store's state.
- Assert hardcoded expected strings (`'1 250,50 MAD'`), never a value recomputed by the code under test.
- No `setTimeout`, no sleeps, no `tick()` gambling. Await the store's own `load()`; it resolves when the data is in.
- A fake that does not emit the real sequence (loading → data, error path, ordering) is fixed once, in the shared fake, never per test.
- For every `expect`, ask: what could I delete from production code and still see green? If the answer is "a lot", the assertion names nothing. Delete it.
- An element that exists from first render regardless of data proves nothing. Assert content, not presence.
- Harnesses and helpers expose behaviour, never implementation: `selectBeneficiary('Youssef Idrissi')`, not `setSelectIndex(0)`. Look up by label, never by index.
- Read the console of a green run. A stray error there means a test asserts the wrong thing.
- Never edit an existing assertion to make a diff pass. If it is wrong, say so in the PR and stop.
- Fewer tests that fail for the right reason beat many that pass for the wrong one.
```

Drop it in on Monday. The next batch of generated tests will still need the walk in scene 3 — but the ratio moves.
