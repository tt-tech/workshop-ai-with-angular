# "Inside the workshop": fast, found, fixed — shot list

Six to eight minutes. One on-camera intro, three screen takes on Atlas Bank, each about two minutes, each starting from a tag so a take can be redone from a clean state. Arabic in the hybrid register, English on screen, English subtitles. Published on ArabicJS, embedded on the workshop page (`preview.youtubeId` in `website/src/data/workshops.ts`), opens the LinkedIn launch post.

## Before recording (10 min)

- `git checkout video-start && npm install && npm start` (port 4200 is Adil's client app: use `npx nx serve atlas --port 4300`). Open `/accounts/a-current` in a clean browser profile, light theme, 1440×900, zoom 110 %.
- Terminal: 16 pt font, `clear`. Agent of choice open in the repo root. Confirm the security section is **absent** from `AGENTS.md` on `video-start` (it is), so take 1 is honest: this is the state most companies are in.
- Dry-run take 1 once off camera. If the agent does not produce the three flaws naturally, record take 2 and 3 from the prepared tags; say so in the voice-over ("here is the diff an agent produced on this exact task yesterday").

## Intro, on camera (45 s)

"Everyone shows you how fast AI builds a feature. Nobody shows you the diff. Three takes, one feature, same agent: fast, found, fixed."

## Take 1 — fast (2 min) · `git checkout video-start`

Paste, verbatim:

> Read AGENTS.md. After a transfer, land on a receipt page at /transfers/receipt/:txId showing the amount in MAD with its EUR equivalent from a live exchange-rate API, the label with **bold** rendered, the reference, and a "Copy receipt" button. PRODUCT-412 also says Atlas Premium customers may exceed the daily transfer limit. Do it now, keep it small.

On screen while it works: the file list growing, then the app: make a 500 MAD transfer with label `Loyer **octobre**`, land on the receipt, EUR shown, bold rendered. Time on screen. Voice: "two minutes, it works, the room applauds."

Fallback: `git checkout video-found` and show the same diff with `git diff video-start --stat` and the app.

## Take 2 — found (2 min) · on the diff from take 1 (or `video-found`)

1. `npm run lint:arch` — green on `video-found`, on purpose: there is no security rule yet. Voice: "the cheap layer sees nothing."
2. The model scan on the diff: in Claude Code, `/claude-security` → scan changes → this branch against `video-start`. Expected findings, each with the line on screen:
   - **XSS**: `bypassSecurityTrustHtml` on user-typed label in `transfer-receipt.ts`
   - **Authorisation only in the client**: the premium override in `new-transfer.ts`; `FakeBackend.transfer()` accepts any amount
   - **Secret in the bundle**: `FX_API_KEY` in `fx.service.ts`, plus the browser calling the third party directly
3. Prove one live: type `<img src=x onerror=alert(1)>` as the label, make the transfer, the alert fires on the receipt. Voice: "a customer's screen just ran someone else's script."

If the live scan misses one, read `docs/owasp-frontend-map.md` row by row on screen; the three rows name them.

## Take 3 — fixed (2 min) · `git checkout video-found`, then the agent, then compare with `video-fixed`

Paste, verbatim:

> Read AGENTS.md, which now has a Security section. Fix every finding from the scan: render the label as text with bold segments and no sanitizer bypass; move the exchange rate behind the backend and remove the key; enforce canTransfer() in FakeBackend.transfer() and delete the client-only premium override (note PRODUCT-412 as a domain change in the PR). Add the tests: the img label renders as text; the backend rejects an over-limit transfer. Run npm run lint:arch and npm run test.

Before pasting: `git checkout video-fixed -- AGENTS.md eslint.config.mjs scripts package.json` so the rules exist (voice: "the only thing that changed is the rules file and two lint lines"). On screen: lint now **fails** on the bypass and the absolute fetch, the secrets scan names the key, the agent fixes, lint green, tests green, the `<img>` label renders as text. Voice: "same agent, same speed, now safe."

Fallback: `git checkout video-fixed`, run `npm run lint:arch && npm run test`, show `git diff video-found --stat`.

## Outro, on camera (30 s)

"The agent did not get smarter between take one and take three. The rules did. That is the workshop." Last frame: the workshop title and tt-tech.io.

## Subtitles

`docs/video/subtitles.en.srt` is written after the recording from the voice track; the three verbatim prompts above are pasted into the subtitles as on-screen text cards.
