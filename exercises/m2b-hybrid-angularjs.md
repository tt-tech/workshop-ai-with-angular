# Module 2b: Demote, don't delete, when the legacy is AngularJS

Two hours. Same rule as module 2, one framework older. You need: module 2 done (or at least scene 1 of it), the repo on `main`, `npm install` done, one AI coding agent installed with a key.

The target is `libs/angularjs/beneficiaries`: an AngularJS 1.8 module running inside the Angular 22 app through `@angular/upgrade`. One component with one controller for the whole screen, one service that fetches, caches, validates, formats, focuses inputs and navigates, `any` everywhere, a RIB formatter that duplicates `formatRib` from `libs/domain`, and a header total formatted with `$filter('number')` while every row uses `formatMad`. Read it before you start (six files under `libs/angularjs/beneficiaries/src/lib`, fifteen minutes).

How it is wired:

- `beneficiaries.module.ts` registers the AngularJS module and the bridges: `downgradeComponent({ component: Amount })` as `atlasAmount`, `downgradeInjectable(AccountsStore)` as `accountsStore`, `downgradeInjectable(Router)` as `ngRouter`
- `beneficiaries-host.ts` is a standalone Angular component on the `/beneficiaries` route. After its first render it creates `BeneficiariesUpgradeModule` and calls `UpgradeModule.bootstrap()` on its own `<div>`: Angular owns the page, AngularJS owns one box inside it
- the app stays zoneless. `UpgradeModule` provides zone-based change detection by default and throws `NG0908: In this configuration Angular requires Zone.js`; `BeneficiariesUpgradeModule` overrides that with `provideZonelessChangeDetection()`, and `UpgradeModule` then runs `$rootScope.$digest()` after every Angular tick instead of on zone turns

Checkpoint commands, used after every scene:

```bash
npm run lint:arch
npm run test
npm run typecheck
npx nx build atlas --configuration=production
git diff --stat main -- libs/angularjs ':!*.spec.ts'   # must print nothing until the delete task
```

---

## Scene 0: Turn on the framework map (5 min)

**Goal:** see which framework renders which part of the screen before you plan anything.

1. Open the live demo (or your local build) and click **Framework map** in the bottom right corner. The choice is kept in `localStorage` under `atlas.frameworkMap`.
2. `/accounts`: one teal box, "Angular standalone". `/beneficiaries`: an orange box, "AngularJS 1.8", and inside it small teal outlines around every amount in the Sent column. Those are `<atlas-amount>`, a modern Angular component, rendered by an AngularJS template.
3. The legend has a third colour, violet, "Angular NgModule (legacy)", for `<atlas-transfer>` from `libs/legacy/transfers`. On `main` it is the real transfer screen: open `/transfers/new/a-current`. After module 2 it is gone.

The teal outlines inside the orange box are the subject of this module.

## Scene 1: Find the hidden readers (25 min)

**Goal:** prove that the compiler cannot see who uses a downgraded Angular piece.

1. In pure Angular, delete a dependency and the compiler names the reader. Try it: `mv libs/feature/requests/src/index.ts /tmp/ && npm run typecheck`. You get `TS2307: Cannot find module '@atlas/feature-requests'` on the route line. Put the file back.
2. Now the hybrid. Rename the downgrade registration in `beneficiaries.module.ts` from `'atlasAmount'` to `'atlasMoney'`. Run `npm run typecheck`, `npm run lint:arch` and the production build. All green. Run `npx nx test angularjs-beneficiaries`: one red, the Sent column is empty. No error in the console: AngularJS treats `<atlas-amount>` as an unknown element and renders nothing. Revert.
3. Rename the input of `Amount` in `libs/ui/src/lib/amount.ts` from `value` to `amount`. This time the Angular compiler helps: the build fails with `NG8002` and `NG8008` in `account-detail.ts` and `dashboard.ts` (`npm run typecheck` does not, it runs plain `tsc` and never reads a template). Fix those two callers as the compiler asks. Build, lint and typecheck are green. The AngularJS template still says `[value]="b.sentMad"`, and the beneficiaries spec fails with `NG0950: Input is required but no value is available yet`. Revert.
4. Rename `'accountsStore'` to `'bankingStore'` in the registration. Everything static is green; every beneficiaries test fails with `[$injector:unpr] Unknown provider: accountsStoreProvider <- accountsStore <- beneficiaryService`. Revert.
5. Delete the `.directive('atlasAmount', …)` line entirely. `npm run typecheck` fails, but read why: `TS6133: 'Amount' is declared but its value is never read`. The import became unused. With a second registration in the same file using `Amount`, it would be green. Revert.

Write down the rule: **a string is not a reference.** Every `downgradeComponent` and `downgradeInjectable` is a dependency the compiler, the boundary lint and the build cannot follow. Only a test that renders the AngularJS template sees it.

## Scene 2: Ask for a plan, then check it (20 min)

1. Paste, verbatim:

   > Read AGENTS.md and every file under libs/angularjs/beneficiaries/src. Propose a plan to migrate the AngularJS beneficiaries screen to a standalone, signals-based feature in this workspace. Plan only: numbered steps, which files are created, changed or deleted at each step, and at which step the route /beneficiaries switches over. Do not write code and do not edit any file.

2. Tick what is wrong:

   - [ ] Step 1 is "delete" or "remove ngUpgrade"
   - [ ] No step lists the downgrade registrations and the AngularJS templates that use them
   - [ ] `Amount` or `AccountsStore` changes shape (renamed input, new method) while the AngularJS screen is still routed
   - [ ] The oversized service is ported as one new service with the same four jobs
   - [ ] A new `BeneficiariesStore` is invented although `AccountsStore` already holds beneficiaries, accounts and transactions
   - [ ] `formatRib` is written again instead of imported from `@atlas/domain`
   - [ ] The header total keeps `$filter('number')` formatting, or changes it silently instead of naming it as a decision
   - [ ] It edits `libs/angularjs/**` without a task file that says `migrate`

3. Say it out loud: **demote, don't delete.** The AngularJS screen keeps serving `/beneficiaries` while the new feature is built beside it. The route flips when the new one is proven. AngularJS and `@angular/upgrade` go last, in their own change.

## Scene 3: Split the oversized controller first (30 min)

**Goal:** a plan of small pieces before any port.

Paste:

> Read docs/tasks/006-migrate-angularjs-beneficiaries.md. Do step 0 only: list every downgradeComponent and downgradeInjectable, their AngularJS names, and every AngularJS template or annotation that uses each name. Then list each method of beneficiary.service.ts and of the controller in beneficiaries.component.ts with one label: store read, rule, formatting, DOM or navigation. Do not write code.

Check the answer against the file. Three registrations (`atlasAmount`, `accountsStore`, `ngRouter`), one template using `<atlas-amount>`, one factory annotation using `'accountsStore'` and `'ngRouter'`. For the service: `load`, `all`, `pending` read the store; `validate`, `sentTo`, `bankFor`, `defaultAccount` are rules; `formatRib`, `totalSentText`, `countText` format; `focus`, `flashRow` touch the DOM; `sendMoney` navigates. That table is the plan: rules become pure functions with their own spec, formatting comes from `@atlas/domain`, DOM goes into the template, the store is read directly.

Note `sentTo`: it matches transfers to a beneficiary by searching the transaction label for the name or the last four RIB digits. That is a business rule hidden in string matching. It gets a spec of its own before it moves anywhere.

## Scene 4: Work from the task file (40 min)

1. Paste:

   > Work from docs/tasks/006-migrate-angularjs-beneficiaries.md.

2. Run the checkpoint commands. Then click through `/beneficiaries` with the framework map on: the orange box is gone, the page is one teal box, and the amounts render the same.
3. Read the diff with these questions:
   - Is `libs/angularjs/**` untouched? The checkpoint `git diff` line must be empty
   - Did `Amount`, `AccountsStore` or `Router` change? They must not: the AngularJS screen is still in the tree and still reads them by string
   - `apps/atlas/src/app/app.routes.ts`: one line changed, from `@atlas/angularjs-beneficiaries` to `@atlas/feature-beneficiaries`
   - Is the header total now `formatMad`? Then the PR names it as the one behaviour difference, with the pinned spec that records the old output

## Take-home

- **List the strings before you plan.** `grep -rn "downgradeComponent\|downgradeInjectable" libs apps`, then grep each registered name in every AngularJS template and annotation. That list is every reader the compiler cannot see. Freeze the shape of everything on it until the AngularJS side is deleted.
- **A rendering test is the only fence.** The beneficiaries spec bootstraps the real hybrid and asserts the text of `<atlas-amount>`. It is the one check that went red in all four renames of scene 1.
- **Zoneless hybrid is possible, not free.** `UpgradeModule` needs `provideZonelessChangeDetection()` in its NgModule. A digest now runs after every Angular tick, and AngularJS runs its own through `$q`, `$timeout` and its event directives. Async work that goes around both (a native promise or a `setTimeout` that changes no Angular signal) updates nothing on screen until something else digests.
- **Delete last.** The delete task removes `libs/angularjs/beneficiaries`, the `type:legacy-ajs` rules in `eslint.config.mjs` and `sheriff.config.ts`, and the `angular`, `@types/angular` and `@angular/upgrade` dependencies. `npm audit` gets shorter by one high-severity package with no fix: AngularJS 1.8.3 is end of life.
