# Module 1 — AI-assisted workflow in an enterprise Angular codebase

Half a day. Three scenes, each one a before/after you can see in a diff. You need: this repo cloned, `npm install` done, one AI coding agent installed (Copilot, Claude Code, Cursor or Gemini CLI — any of them, we compare later), and an API key or plan for it (a free or 10–20 $ tier is enough for everything here).

Checkpoint commands, used after every scene:

```bash
npm run lint:arch     # boundaries + house rules
npm run test          # Vitest, all projects
npm run typecheck
git diff --stat       # how big was that?
```

---

## Scene 1 — The unconstrained request (20 min)

**Goal:** see what an agent does to a monorepo when nothing tells it the rules.

1. Check out the starting state: `git switch track1/m1-start`. In this state `AGENTS.md` and the tool-specific files are **removed**, and the ESLint boundary rules are the Nx default (`*` may depend on `*`).
2. Open the agent in the repo root and paste, verbatim:

   > Add an "Export CSV" button on the account page that downloads the currently filtered transactions. Also show the linked card status next to each account in the accounts list.

3. Let it finish. Do not steer it. Run the checkpoint commands.
4. Write down, on paper: how many files changed, how many lines, which libraries it touched, whether `ui` now imports `data-access`, whether it edited anything under `libs/legacy`, whether it touched an existing test's assertions.

Typical result in our runs: 6–12 files, 400–900 lines, a store injected into a `ui` component, a new helper in `apps/atlas`, and one existing spec "adjusted". It compiles. Lint is green because nothing was enforced. That is the problem.

`git stash` or `git checkout .` before scene 2 — keep your notes.

---

## Scene 2 — Same request, with the three files (45 min)

**Goal:** the same agent, the same prompt, inside the fence.

1. `git switch main`: `AGENTS.md` present, thin pointer files for each tool, boundary rules active in `eslint.config.mjs`, a task file at `docs/tasks/001-export-transactions-csv.md`.
2. Read `AGENTS.md` once, as the agent will. Notice what is _not_ in it: no architecture vision, no history. Fences and checks only.
3. Open the agent and paste:

   > Work from docs/tasks/001-export-transactions-csv.md.

   Nothing else. The task file carries scope, out-of-scope, done-when and the 300-line limit.

4. Let it finish. Run the checkpoint commands. Compare with your scene 1 notes: files, lines, boundaries, legacy, assertions.
5. Now break the fence on purpose: open `libs/ui/src/lib/page-header.ts`, inject `AccountsStore` from `@atlas/data-access-banking`, run `npm run lint:arch`. Read the error. Revert. That error is what the agent loops on until it is fixed, because `AGENTS.md` says the command must pass before it is done.
6. Optional: run the same task through Sheriff instead of Nx boundaries — `npm run lint:arch:sheriff` — and open `sheriff.config.ts`. Same contract, no Nx required.

What to take from it: the difference between the two diffs is not the model. It is the 40 lines of `AGENTS.md` and the one lint rule.

---

## Scene 3 — The fifteen rules, and one repo with three agents (60 min)

**Goal:** learn to read an agent's diff the way a senior reviewer does, and see that the tool matters less than the rules.

### 3a. Review the scene-2 diff against the judgement rules

Walk the diff with this list. Tick every rule the agent broke even though lint was green:

- [ ] Defensive code for a state no caller can produce (`?? []`, `if (!x) return` on something guaranteed)
- [ ] `effect()` used where a `computed()` would derive the value
- [ ] A signal read short-circuited (`a() || b()`)
- [ ] A service that subscribes to itself, or a component that `.subscribe()`s for view data
- [ ] A service importing a type from a component
- [ ] Data-shaping logic inside a component instead of a pure function with its own spec
- [ ] A magic literal inline (`','`, `'text/csv'`, a column list) instead of a named `const`
- [ ] A local constant that already exists in `libs/domain` (`formatMad`, `formatRib`, `categoryLabel`)
- [ ] A new pattern where a sibling already had the shape (compare with `account-list.ts`)
- [ ] A shared signature changed without updating every caller
- [ ] A predicate whose name is not true when it returns true
- [ ] A handler named after the DOM event instead of the intent (`onClick` vs `exportCsv`)
- [ ] Optional fields inherited from nowhere (`?` with no real absent case)
- [ ] `public` keyword, getter/setter pairs, single-use intermediates
- [ ] A rationale comment in code instead of in the PR description

Count the ticks. Then decide, per rule: **lint or judgement?** Anything mechanical goes into `eslint.config.mjs` now (we already ban `any`, `console.log`, files over 400 lines, loose equality). Anything that needs a human stays in `AGENTS.md`.

### 3b. Three agents, one task

Three people, three different agents (or one person, three tools), the same task file, the same `main`:

```bash
git checkout -b m1/<your-tool> main
# run the task from docs/tasks/001-export-transactions-csv.md with your agent
npm run lint:arch && npm run test && git diff --stat main
```

Put the three diffs side by side. Discuss: where do they differ, and is any difference bigger than the scene 1 → scene 2 difference? In our runs, never.

Notice what made three tools behave the same: `AGENTS.md` (one source of truth), thin per-tool pointers (`CLAUDE.md`, `.cursor/rules/atlas.mdc`, `.github/copilot-instructions.md`, `GEMINI.md`), the layered skills (`angular-developer` from Angular itself + the repo's own `atlas-conventions`, which is the 40-line diff and wins on conflict — e.g. it forbids restating OnPush because it is the v22 default), and checks that don't care who wrote the code.

---

## Take-home

- Copy `AGENTS.md`, `docs/tasks/TEMPLATE.md` and the `depConstraints` block into your own repo on Monday. Rewrite the table for your layout. Delete every sentence that is not a fence or a check.
- If you are not on Nx: `sheriff.config.ts` is the same contract in three minutes.
- The task template is the thing that changes the most per line: scope, out of scope, done-when, size limit.
