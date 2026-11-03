# Module 2c: Restyle without breaking, tokens as the contract

One hour. You need: the repo on `main`, `npm install` done, one AI coding agent installed with a key.

Atlas has a small design system in plain SCSS, no utility framework:

- `apps/atlas/src/styles/tokens`: the palette (the only place a colour is written as a value), the semantic roles (`--color-surface`, `--color-text-muted`, `--color-credit`, light and dark), and the scales (space, radius, type)
- `apps/atlas/src/styles/{base,components,utilities}`: reset, document, `.card`, `.button`, `.field`, `.table`, `.alert`, `.muted`, `.num`
- `apps/atlas/src/styles.scss` declares the cascade once: `@layer reset, tokens, base, components, utilities`. Component styles are unlayered, so they win over every global rule without `!important`

Two rules make it a contract an agent can follow: `npm run check:tokens` fails on a raw colour outside the tokens, and the URL tests read labels, button names and `role=alert`, never classes. Read `AGENTS.md` "Styles" first (five minutes).

---

## Scene 1: The hex trap (15 min)

**Goal:** see the agent reach for a value, and the check stop it.

1. Ask your agent, with no other context: _"On the dashboard, make the 'spent this month' figure stand out in a warm orange."_
2. If the agent writes a hex code in `dashboard.ts`, run `npm run lint:arch`: `check-tokens` names the file and line. (If it already used a token, break it yourself with one hex and run the check.)
3. Ask again, this time starting with _"Read AGENTS.md first."_ The good answer reuses `--color-warning`, or adds one role to `_theme.scss` with a light and a dark value. Switch the theme button in the rail and check both.

Discuss: a lint rule turns "use the design system" from a review comment into a red build. Same idea as the architecture lint in module 2.

## Scene 2: Restyle safely (20 min)

**Goal:** change how a screen looks and prove the flow did not change.

1. Run `npx nx test atlas` and note the transfer screen tests: they open `/transfers/new/a-current`, fill fields by label and click "Confirm transfer".
2. Ask the agent to restyle the transfer form as it likes: layout, spacing, a different summary. Tell it labels, button names and alert texts are fixed.
3. Run the tests again, unchanged. Green means the user can still do the same thing. Now ask for one more change that renames "Confirm transfer" to "Send". Watch the URL test fail: a renamed button is a changed flow, and someone has to decide it on purpose.

## Scene 3: Task 007 (25 min)

Run `docs/tasks/007-blocked-account-banner.md` with your agent. Check the done-when yourself, in both themes, before you call it done.

Money UX to look for in the result: the reason is said in words ("Contact your advisor"), the impossible action is not offered, and nothing relies on colour alone.
