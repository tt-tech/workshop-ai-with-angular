# Where the standard lives: OWASP, mapped to what a frontend team controls

One page for module 5. The lists change; the mapping is the thing to keep. Check the current editions at https://owasp.org/www-project-top-ten/ and https://genai.owasp.org/ before every workshop; never quote a numbered entry from memory on a slide.

## OWASP Top 10 for web applications → the frontend's share

| Risk family | What the frontend actually controls | Atlas Bank example | Caught by |
|---|---|---|---|
| Broken access control | Nothing real. The client check is UX; the rule runs on the server. A client-only check is a finding | the "premium override" in `new-transfer.ts` on `video-found`; the fix enforces `canTransfer()` in `FakeBackend.transfer()` | review, the model scan, `fake-backend.spec.ts` |
| Injection (XSS) | Everything. Angular sanitizes bindings; a `bypassSecurityTrust*` call or HTML built from user text reopens the door | `bypassSecurityTrustHtml` on the receipt label on `video-found`; the fix renders segments | lint (`no-restricted-syntax`), `transfer-receipt.spec.ts` |
| Cryptographic failures / secrets | Nothing in the bundle, ever. A key in client code is public | `FX_API_KEY` in `fx.service.ts` on `video-found` | `npm run scan:secrets` |
| Insecure design | The data boundary: what the browser receives at all, what it sends to third parties | the browser calling an exchange-rate API directly | lint (absolute `fetch` URL), review |
| Vulnerable components | Dependencies the agent adds "to make it work" | a markdown library pulled in for one bold tag | `npm audit`, the diff review ("did we ask for this?") |
| Security misconfiguration | CSP, headers, source maps in production | out of scope for the demo; see the site's `netlify.toml` for the pattern | deploy checklist |
| Identification and authentication | Tokens in storage, session handling | not in the demo | review |
| Logging and monitoring | Client errors reported without PII | not in the demo | review |

## OWASP Top 10 for LLM applications → Track 2 of the series

| Risk | In an Angular product | Part of the series |
|---|---|---|
| Prompt injection | user text reaches the model through your own screens; tools the model can call | *The data the model may see*, *Tool calling* |
| Sensitive information disclosure | the model answers with whatever it was given; authorisation before the model | *The data the model may see* |
| Excessive agency | write tools without a human confirmation; the model touching state directly | *Tool calling*, *Agentic UI* |
| Unbounded consumption | no token cap, no abort, no rate limit | *Streaming into signals*, *Tool calling* |
| Supply chain / model provenance | which model, hosted where, decided by the data classification | *The data the model may see* |

## Two layers, always both

1. **Cheap and deterministic:** lint rules and the secrets scan, in `npm run lint:arch`, run by the agent before it says "done".
2. **Thorough and model-based:** a security scan over the diff (`/claude-security` on the diff, or your tool's equivalent), run before a human reads it. The scan sees the client-only check that no lint rule can.

What neither sees: the authorisation logic your product should have and does not. That stays a design review.
