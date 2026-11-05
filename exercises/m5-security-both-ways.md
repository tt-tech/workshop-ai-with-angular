# Module 5 — Security: AI as the attacker, AI as the reviewer

Half a day. One feature, built fast, scanned, fixed. You need: modules 1 and 2 done, the repo on `track1/m5-start`, one agent, and a security-scan tool (Claude Code's `/claude-security`, or your tool's equivalent). The one-page map of where the standard lives: `docs/owasp-frontend-map.md`.

Checkpoint commands, after every scene:

```bash
npm run lint:arch          # boundaries, house rules, secrets scan
npm run test
git diff --stat track1/m5-start
```

---

## Scene 1 — Fast (25 min)

**Goal:** build the receipt feature the way everyone does: quickly, from the ticket, with no security rule in the rules file yet.

1. `git switch -c m5/<your-tool> origin/track1/m5-start`. Read `AGENTS.md`: there is no Security section. That is deliberate.
2. Paste the take-1 prompt from `docs/video/preview-video.md` verbatim. Let the agent finish. Make a transfer with label `Loyer **octobre**` and look at the receipt.
3. Checkpoint. Lint is green. Tests are green. Write down how long it took.

## Scene 2 — Found (45 min)

**Goal:** see what speed left behind, with both layers of the scan.

1. Run the model-based scan on your diff. Read every finding against `docs/owasp-frontend-map.md`. Tick what it found:
   - [ ] HTML built from user input, or a sanitizer bypass, on the receipt label
   - [ ] A business rule enforced only in the client (the premium override), while the backend accepts any amount
   - [ ] A key or token in client code
   - [ ] The browser calling a third party directly
   - [ ] A dependency nobody asked for
2. Prove one finding live: the `<img src=x onerror=alert(1)>` label.
3. Compare with the reference: `git diff video-start video-found --stat`. The reference diff has all five. Did yours? Agents vary; the list does not.
4. Run the scan a second time with a different model or a fresh session. Write down what only one of the two found.

## Scene 3 — The rules, then the fix (45 min)

**Goal:** make the same agent produce the safe version, by changing nothing but the rules.

1. `git checkout origin/track1/m5-security-solution -- AGENTS.md eslint.config.mjs scripts package.json`. Read the new Security section and the two lint rules. Run `npm run lint:arch`: it now fails on your scene-1 code. That failure is the lesson.
2. Paste the take-3 prompt verbatim. Checkpoint: lint green, tests green, the img label renders as text, the backend rejects the over-limit transfer.
3. Walk your diff against the reference (`git diff track1/m5-security-solution`). Three things to look for: did the rule move to the boundary or just get duplicated; did the label renderer stay in the template or did a library appear; where did the rate come from.

## Scene 4 — Write the lines for your own repo (25 min)

- The two lint rules, adapted to your lint setup, in a PR.
- The secrets scan in your "done" command.
- The six lines of the Security section, in your rules file, in your words.
- A dated note in `docs/decisions`: which scan runs on every agent diff, and who reads the findings.

Reference branches: `track1/m5-start` (no rules), `track1/m5-security-solution` (rules + fix + tests). The fast feature with its five findings, as recorded for the video, is the tag `video-found` (an older base: compare it with `video-start`).
