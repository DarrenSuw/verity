# Verity — Message Check

A customer-facing tool that checks a suspicious "support" message for scam warning signs and tells the customer how to verify it safely before acting.

The customer pastes a text, email, chat message or notes from a phone call. Verity:

1. **Highlights the warning signs** in the message itself, with a plain-language reason for each.
2. **Shows where every link really goes**, and flags links that imitate the company or well-known brands.
3. **Gives a step-by-step safe-check plan** tailored to what it found (and to the channel: a phone call gets "hang up and call back").
4. **Covers "I already clicked/paid"** with recovery steps.
5. Optionally adds an **AI second opinion** when an API key is configured.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app works fully without any API key.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run test:engine` | Regression checks for the detection engine (12 cases) |
| `npm run typecheck` / `npm run lint` | Static checks |

### Optional: AI second opinion

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. The page then requests an AI review in parallel with the rule check and shows it as a separate card. Rule results never wait on it, and if it fails the rule results still stand.

## Make it yours

All company-specific facts live in [`src/config/organization.ts`](src/config/organization.ts): name, the domains you own, support phone, app name and report address. `Verity`, `verity.bank` and the 555 phone number are placeholders. Replace them before going live, because look-alike link detection and every "contact us" instruction depend on them.

## How detection works

`src/lib/analyzer/` is a deterministic rule engine. It is instant and explainable, and the message never leaves your server.

| File | Role |
|---|---|
| `rules.ts` | Text patterns for each tactic: code/PIN requests, "safe account", gift cards and crypto, remote-access apps, secrecy, urgency, threats, account alerts, impersonation, channel switching, prizes, delivery scams, generic greetings |
| `links.ts` | Link extraction, real-owner domain, shorteners, raw-IP/punycode/`@` tricks, risky endings, brand look-alikes; phone-number extraction |
| `engine.ts` | Runs the rules, skips negated phrases ("we will *never* ask for your PIN"), scores, and assigns the risk level |
| `guidance.ts` | Builds the safe-check steps and recovery steps from the findings |

**Risk levels.** Any *critical* sign (asking for codes, moving money, gift cards/crypto, remote access, secrecy, a look-alike or disguised link) means **High risk**. Otherwise the signs are weighted (serious 40, caution 18, minor 7, plus a bonus when several kinds of tactic appear together): 55+ is High risk and 18+ is Suspicious. A clean result never says "safe", only "no common warning signs found".

## API

`POST /api/analyze`: `{ "message": string, "channel": "sms" | "email" | "chat" | "call" }` returns the analysis (signals with exact character spans, links, steps).
`POST /api/review`: same body, returns the AI review. Returns 404 when AI is not configured.

Input is validated with Zod (max 6,000 characters). Nothing is stored or logged.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Zod · AI review (optional)
