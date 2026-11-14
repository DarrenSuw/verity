# Verity — Message Check

A customer-facing tool that checks a suspicious "support" message for scam warning signs and tells the customer how to verify it safely before acting.

The customer pastes a text, email, chat message or notes from a phone call — **or drops in a screenshot**. Verity:

1. **Highlights the warning signs** in the message itself, with a plain-language reason for each.
2. **Names the scam** when it recognises the pattern, and says *what the sender will try next*.
3. **Shows where every link and address really goes**, and flags those imitating the company or a well-known brand.
4. **Gives a safe-check plan** tailored to what it found and to the channel — a phone call gets "hang up and call back on a number you trust".
5. **Checks a single link, number or address** on its own, for when there's no message to paste.
6. **Covers "I already clicked/paid"** with recovery steps.
7. Optionally adds an **AI second opinion** when an API key is configured.

Everything above works with no API key and no account.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run test:engine` | Regression checks for the detection engine (45 cases) |
| `npm run typecheck` / `npm run lint` | Static checks |

### Optional: AI second opinion

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. The page then requests an AI review in parallel with the rule check and shows it as a separate card. Rule results never wait on it, and if it fails the rule results still stand.

## Make it yours

All company-specific facts live in [`src/config/organization.ts`](src/config/organization.ts): name, the domains you own, support phone, app name and report address. `Verity`, `verity.bank` and the 555 phone number are placeholders. Replace them before going live, because look-alike detection and every "contact us" instruction depend on them.

## How detection works

`src/lib/analyzer/` is a deterministic rule engine: 30 checks in 11 groups. The same message always gets the same answer, and every result publishes which checks ran.

| File | Role |
|---|---|
| `rules.ts` | Text patterns per tactic: code/PIN requests, "safe account", gift cards and crypto, remote access, attachments, QR codes, "new number" impersonation, secrecy, urgency, threats, account alerts, channel switching, prizes, delivery scams, generic greetings |
| `links.ts` | Link and email extraction, real-owner domain, shorteners, raw-IP/punycode/`@` tricks, risky endings, brand look-alikes, sender-address imitation; phone-number extraction |
| `normalize.ts` | Undoes filter evasion — spaced-out words, digits and symbols standing in for letters, look-alike letters from other alphabets — while mapping every match back to its exact place in the original text |
| `detectors.ts` | Disguised characters, cryptocurrency wallets, bank details to pay into |
| `language.ts` | Decides whether the English rules can meaningfully read this message at all |
| `playbooks.ts` | Matches the findings to a named scam script and what usually happens next |
| `checks.ts` | The published catalogue of every check, shown to the customer and asserted by the tests |
| `identity.ts` | The standalone link / phone / email check |
| `engine.ts` | Runs each rule twice (as written, and with evasion undone), scores, assigns the risk level |
| `guidance.ts` | Builds the safe-check and recovery steps from the findings |

**Risk levels.** Any *critical* sign (asking for codes, moving money, gift cards or crypto, remote access, secrecy, a look-alike or disguised link, disguised characters) means **High risk**. Otherwise the signs are weighted (serious 40, caution 18, minor 7, plus a bonus when several kinds of tactic appear together): 55+ is High risk and 18+ is Suspicious.

**Two deliberate restraints.** A clean result never says "safe" — only "no common warning signs found". And when a message isn't in English, the tool says its checks didn't apply rather than reporting a clean result, because silence would read as approval.

## Privacy

- **Screenshots never leave the device.** Text is recognised in the browser with Tesseract loaded from a CDN; the image is never uploaded.
- **Card numbers are stripped in the browser** (Luhn-checked) before the request is sent, so they cannot be logged anywhere.
- **Nothing is stored.** No account, no history, no retention after the response.
- Strict CSP, `no-referrer`, `frame-ancestors 'none'`, HSTS, and per-IP rate limits on every endpoint.

## API

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/analyze` | `{ message, channel: "sms" \| "email" \| "chat" \| "call" }` | Full analysis: signals with exact character spans, links, emails, playbook, coverage, checks, steps |
| `POST /api/verify` | `{ value }` | Verdict for one link, phone number or email address |
| `POST /api/review` | same as analyze | AI second opinion; 404 when not configured |

Input is validated with Zod (max 6,000 characters). Rate limited per IP: 40/min for analyze, 60/min for verify, 10/min for review.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Zod · Tesseract.js (client-side OCR) · AI review (optional)
