# Generative UI on `/assistant` (A2UI v1.0)

The customer asks a question; a model answers with [A2UI](https://a2ui.org) messages; the page renders them with `@a2ui/angular`. The model only arranges components. Every money figure comes from our server.

## Run it

Two terminals from this folder:

```sh
npm run assistant:api:fake   # scripted answers, no keys, no model call
npm start                    # the app; /api is proxied to 127.0.0.1:3333
```

Open `/assistant`. For real models, stop the first one and run `npm run assistant:api`. It reads the keys from the macOS Keychain at start (`security find-generic-password -s anthropic-api-key -w`, same for `openai-api-key`) into the server's environment only; nothing is written to a file. Add a key once with `security add-generic-password -a "$USER" -s anthropic-api-key -w`.

## Your own API key

No Keychain, or not on a Mac: run `npm run assistant:api:own-key` and paste your key into the key field on `/assistant`. The field shows for Claude and GPT. Where the key goes, and the code that does it:

- The page keeps it in memory only, never in browser storage, so it is gone on reload (`libs/data-access/assistant/src/lib/assistant.store.ts`, `apiKeysState`).
- It travels only to this server on `127.0.0.1`, through the dev proxy (`apps/atlas/proxy.conf.json`); the server refuses any other host (`apps/assistant-api/src/http/request-guard.ts`).
- The server uses it for that one request and keeps nothing (`apps/assistant-api/src/models/model-for.ts`, `withKey`).
- It never reaches a file, the log or the trace; the spec "a key typed in the page" proves it (`apps/assistant-api/src/assistant.spec.ts`).

A key typed in the page wins over the Keychain key for that request.

## Settings

| Variable             | Default             | Meaning                                                      |
| -------------------- | ------------------- | ------------------------------------------------------------ |
| `ATLAS_MODEL`        | unset               | `fake` uses the scripted `ScriptedModelClient` for every choice |
| `ATLAS_CLAUDE_MODEL` | `claude-sonnet-5-5` | Claude model id                                              |
| `ATLAS_GPT_MODEL`    | none, required      | OpenAI model id; the GPT switch fails with a message without it |
| `ATLAS_SHOW_TRACE`   | unset (`1` in the `fake` and `own-key` scripts) | `1` sends each request's server log with the reply; the page shows it under the answer. Demo only: production keeps the model's input and the server's reasons on the server |
| `ATLAS_API_PORT`     | `3333`              | keep `apps/atlas/proxy.conf.json` in step                    |

Claude calls use the server-side refusal fallback (`fallbacks: "default"`) and `effort: low`. Both clients time out after 30 s and cap output at 4000 tokens.

## What goes to the model, and what does not

Sent, nothing else: the question; the protocol rules; the allowed component names; the macro list; the current month; and per account of the signed-in customer its id, label, type and status (`- a-current: Current account (current, active)`).

Never sent: the customer's name, balances, transaction amounts, labels or dates, account numbers (not even masked), other customers' accounts. A spec in `apps/assistant-api` fails if any of them appears in the prompt.

## What the model may draw

Layout and digit-free text only. The server checks every node the model writes against a strict allow-list (`apps/assistant-api/src/gate/model-components.ts`):

| Component        | Props allowed                                                     |
| ---------------- | ----------------------------------------------------------------- |
| `Column`, `Row`  | `children` (list of ids), `justify`, `align`                       |
| `Card`           | `child`                                                           |
| `Text`           | `text` as a literal string with no number and no currency sign, `variant` |
| `Divider`        | `axis`                                                            |
| `Button`         | `child`, `variant`, action `show_transactions` with `{accountId}` |

Text rule: after NFKC normalisation and removal of format characters (`\p{Cf}`, such as zero-width spaces), any number (`\p{N}`, every script's digits) or currency sign (`\p{Sc}`) rejects the node. The model's own sentence follows the same rule; when it fails it becomes "Here is your answer." Only macros put numbers on screen.

Anything else (Image, Video, Icon, List, a data binding, a function call, a URL, an extra prop) becomes an error card saying "Images, links and other components are not allowed here." Text with a number becomes "Only the bank may show amounts.", a macro with bad arguments "This part could not be shown.", and another customer's account "That account is not one of yours.". The model's input is never echoed: the detail goes to the server log. The model's own `dataModel` is dropped.

After expansion the server checks the shape of the answer and replaces it with one error card ("This answer could not be shown.") if:

- it has more than 200 nodes, a duplicate id, or no `root`;
- a child id does not exist, or an id is referenced more than once (a tree, not a graph), or a node cannot be reached from `root` (this also catches cycles);
- a node the model wrote references an id containing `__`, which only macros create. Model ids containing `__` reject the whole answer.

`apps/atlas/src/index.html` also sets `img-src 'self' data:; media-src 'self'`.

## Macros

The model writes `{"id": "summary", "component": "AccountSummary", "accountId": "a-current"}`. The server validates the arguments with zod, checks that the account belongs to the signed-in demo customer, reads the values, and replaces the node with `AccountCard`, `SpendingChart` or `TransactionList` bound to the data model. The renderer only ever receives catalog components.

| Macro                                     | Becomes                                    |
| ----------------------------------------- | ------------------------------------------ |
| `AccountSummary(accountId)`               | `AccountCard` + "Show recent transactions" |
| `SpendingChart(accountId, month)`         | `SpendingChart` (debits per category)      |
| `RecentTransactions(accountId, limit≤10)` | `TransactionList`                          |

An unknown component, bad arguments or a foreign account becomes a visible error card, never a silent empty node. The model cannot emit the three Atlas components directly.

## Actions and the HTTP boundary

`/api/assistant/action` accepts exactly one action, `show_transactions` with a context of `{accountId}` and nothing more; any other name (including `constructor`) is a 400. The account is checked against the signed-in customer like any macro. Nothing on this page moves money.

The server listens on `127.0.0.1` only, answers loopback `Host` headers only (403 otherwise), takes `application/json` only (415), at most 16 KiB of body (413) within 10 s. Model calls time out after 30 s (one retry) and may write at most 4000 tokens. A failed, timed-out or cut-off call (refusal, `max_tokens`, incomplete GPT answer) is a 502 with a generic message; the detail goes to the server log only.

These TypeScript macros are our stand-in. Macros ship today only in the Python agent SDK (`MacroExpander`); when the official TypeScript SDK (`@a2ui/agent`) gets them, replace `gate/macro.ts` and the macro dispatch in `gate/gate.ts` with it. The allow-list (`gate/model-components.ts`) and the tree check (`gate/tree.ts`) stay: they are ours, not the SDK's, and the macros in `gate/macros/` keep their shape.
