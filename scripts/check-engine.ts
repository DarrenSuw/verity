/**
 * Regression checks for the rule engine. Run with: npm run test:engine
 *
 * Three groups: whole messages, card-number redaction, and the single
 * link/number/address checker. The genuine-message cases matter most — a tool
 * that cries wolf stops being read.
 */
import { CHECK_GROUPS } from "../src/lib/analyzer/checks";
import { analyzeMessage } from "../src/lib/analyzer/engine";
import { checkIdentifier, type IdentifierVerdict } from "../src/lib/analyzer/identity";
import { patternRules } from "../src/lib/analyzer/rules";
import { tidyOcrText } from "../src/lib/ocr-text";
import { redactCardNumbers } from "../src/lib/redact";
import { samples } from "../src/lib/samples";
import type { Channel, RiskLevel } from "../src/lib/analyzer/types";

let failed = 0;
const fail = (name: string, problems: string[], detail = "") => {
  failed++;
  console.log(`✗ ${name}\n    ${problems.join("\n    ")}${detail ? `\n    ${detail}` : ""}`);
};

/* ---------------------------------------------------------------- messages */

interface Case {
  name: string;
  text: string;
  channel?: Channel;
  risk: RiskLevel;
  mustInclude?: string[];
  mustExclude?: string[];
  playbook?: string | null;
  supported?: boolean;
}

const bySample = Object.fromEntries(samples.map((s) => [s.id, s]));

const cases: Case[] = [
  {
    name: "sample: fraud team SMS",
    text: bySample["fraud-team"].text,
    risk: "high",
    mustInclude: ["credential-request", "link-lookalike", "urgency", "threat", "account-alert", "callback-number", "link-risky-tld"],
    playbook: "code-harvesting",
    supported: true,
  },
  {
    name: "sample: safe account call",
    text: bySample["safe-account"].text,
    channel: "call",
    risk: "high",
    mustInclude: ["safe-account", "secrecy", "remote-access", "impersonation", "threat"],
    playbook: "safe-account",
  },
  {
    name: "sample: parcel redelivery",
    text: bySample["parcel"].text,
    risk: "high",
    mustInclude: ["fee-request", "link-shortened", "delivery", "generic-greeting"],
    playbook: "delivery-fee",
  },
  {
    name: "sample: QR parking notice",
    text: bySample["qr-parking"].text,
    risk: "high",
    mustInclude: ["quishing"],
    playbook: "qr-code",
  },
  {
    name: "sample: new number from family",
    text: bySample["new-number"].text,
    channel: "chat",
    risk: "high",
    mustInclude: ["new-number", "secrecy"],
    playbook: "known-contact",
  },
  {
    name: "sample: genuine OTP is not flagged as a credential request",
    text: bySample["genuine-otp"].text,
    risk: "low",
    mustExclude: ["credential-request", "disguised-wording", "hidden-characters"],
    playbook: null,
    supported: true,
  },
  {
    name: "official link is not flagged",
    text: "Your statement is ready. Log in at https://verity.bank/statements to view it.",
    risk: "low",
    mustExclude: ["link-unofficial", "link-lookalike"],
  },
  {
    name: "gift card request",
    text: "This is customer support. To cancel the refund error please buy two Google Play cards and send the codes.",
    risk: "high",
    mustInclude: ["unusual-payment", "impersonation"],
  },
  {
    name: "WhatsApp move + prize",
    text: "Congratulations! You have been selected for a $500 cashback reward. Message our agent on WhatsApp to claim your reward.",
    risk: "medium",
    mustInclude: ["prize", "channel-switch"],
    playbook: "advance-fee",
  },
  {
    name: "IP address link",
    text: "Please sign in here: http://192.168.4.20/login",
    risk: "high",
    mustInclude: ["link-disguised"],
  },
  {
    name: "PayPal look-alike",
    text: "Your PayPal payment is on hold. Review at paypal-resolution-center.com",
    risk: "high",
    mustInclude: ["link-lookalike"],
  },
  {
    name: "plain friendly note",
    text: "Hi Sam, thanks for visiting our branch today. Let us know if there's anything else we can help with.",
    risk: "low",
    mustExclude: ["link-unofficial", "callback-number", "new-number"],
  },
  {
    name: "email address is not treated as a link",
    text: "Questions? Email help@verity.bank and we'll get back to you.",
    risk: "low",
    mustExclude: ["link-unofficial", "sender-domain"],
  },
  {
    name: "app store download is not flagged",
    text: "Download the Verity app from the App Store to manage your card.",
    risk: "low",
    mustExclude: ["install-request", "remote-access"],
  },
  {
    name: "QR code inside our own app is not flagged",
    text: "Scan the QR code in the Verity app to log in on your laptop.",
    risk: "low",
    mustExclude: ["quishing"],
  },

  /* evasion */
  {
    name: "digit and symbol substitution is seen through",
    text: "URGENT: your acc0unt is l0cked. Verify your pa$$word at https://verity-secure.top/login",
    risk: "high",
    mustInclude: ["disguised-wording", "credential-request", "threat", "urgency", "link-lookalike"],
  },
  {
    name: "spaced-out letters are seen through",
    text: "Our fraud team needs you to send your p a s s w o r d so we can secure the account.",
    risk: "high",
    mustInclude: ["disguised-wording", "credential-request"],
  },
  {
    name: "look-alike letters from another alphabet are flagged",
    text: "Verity notice: please confirm your аccount details to avoid a hold.",
    risk: "high",
    mustInclude: ["hidden-characters"],
  },
  {
    name: "ordinary English is not accused of evasion",
    text: "Thanks for banking with us. Your new card is on its way and should arrive within 5 working days.",
    risk: "low",
    mustExclude: ["disguised-wording", "hidden-characters"],
  },

  /* payment destinations */
  {
    name: "crypto wallet address",
    text: "To release your refund send 0.5 BTC to bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq today.",
    risk: "high",
    mustInclude: ["crypto-wallet", "unusual-payment"],
    playbook: "irreversible-payment",
  },
  {
    name: "bank details to pay into",
    text: "Please transfer the outstanding balance to account number 12345678, sort code 12-34-56.",
    risk: "medium",
    mustInclude: ["payment-destination"],
  },
  {
    name: "a reference number is not a payment destination",
    text: "Thanks for your payment. Your reference is 8827461 and it will show on your statement tomorrow.",
    risk: "low",
    mustExclude: ["payment-destination", "crypto-wallet"],
  },

  /* sender identity */
  {
    name: "look-alike sender address",
    text: "From: security@verity-alerts.com\nYour account needs verification before Friday.",
    risk: "high",
    mustInclude: ["sender-domain"],
  },
  {
    name: "attachment request",
    text: "Dear customer, please review the attached invoice and confirm payment details.",
    risk: "medium",
    mustInclude: ["attachment"],
  },

  /* coverage */
  {
    name: "Spanish message is reported as outside our coverage",
    text: "Estimado cliente, su cuenta ha sido suspendida temporalmente. Por favor confirme sus datos personales en el siguiente enlace para evitar el cierre definitivo de su cuenta.",
    risk: "low",
    supported: false,
  },
  {
    name: "short English message is not mistaken for another language",
    text: "Your card ends 4417. Call us back when you can.",
    risk: "low",
    supported: true,
  },
];

for (const c of cases) {
  const result = analyzeMessage(c.text, c.channel ?? "sms");
  const ids = result.signals.map((s) => s.id);
  const problems: string[] = [];
  if (result.risk !== c.risk) problems.push(`risk ${result.risk} ≠ expected ${c.risk}`);
  for (const id of c.mustInclude ?? []) if (!ids.includes(id)) problems.push(`missing ${id}`);
  for (const id of c.mustExclude ?? []) if (ids.includes(id)) problems.push(`unexpected ${id}`);
  if (c.playbook !== undefined && (result.playbook?.id ?? null) !== c.playbook)
    problems.push(`playbook ${result.playbook?.id ?? "none"} ≠ expected ${c.playbook ?? "none"}`);
  if (c.supported !== undefined && result.coverage.supported !== c.supported)
    problems.push(`coverage.supported ${result.coverage.supported} ≠ expected ${c.supported}`);

  // Every span must point at the exact text it claims to.
  for (const s of result.signals)
    for (const span of s.spans)
      if (c.text.slice(span.start, span.end) !== span.text) problems.push(`bad span in ${s.id}: "${span.text}"`);

  if (problems.length) fail(c.name, problems, `got: ${result.risk} [${ids.join(", ")}]`);
  else console.log(`✓ ${c.name}  (${result.risk}, ${ids.length} signs)`);
}

/* --------------------------------------------------------------- redaction */

const redactionCases: { name: string; text: string; count: number }[] = [
  { name: "redacts a Visa number", text: "I entered 4111 1111 1111 1111 on the page", count: 1 },
  { name: "redacts two cards", text: "4111111111111111 and 5500005555555559", count: 2 },
  { name: "leaves a non-Luhn reference alone", text: "Reference 1234567812345678 is on your statement", count: 0 },
  { name: "leaves a phone number alone", text: "Call +1 800 555 0199 to reach us", count: 0 },
  { name: "leaves a one-time code alone", text: "Your code is 482913", count: 0 },
];

for (const c of redactionCases) {
  const { text, count } = redactCardNumbers(c.text);
  const problems: string[] = [];
  if (count !== c.count) problems.push(`redacted ${count} ≠ expected ${c.count}`);
  if (count > 0 && /\d{13,}/.test(text.replace(/\D/g, ""))) problems.push("digits survived redaction");
  if (problems.length) fail(`redact: ${c.name}`, problems, `got: ${text}`);
  else console.log(`✓ redact: ${c.name}`);
}

/* -------------------------------------------------------------- screenshots */

const ocrCases: { name: string; raw: string; expect: string }[] = [
  {
    name: "rejoins a link broken across lines",
    raw: "verify your details at https://verity-secure-\nlogin.top/verify or call us",
    expect: "verify your details at https://verity-secure-login.top/verify or call us",
  },
  {
    name: "rejoins a link wrapped without a hyphen",
    raw: "go to https://verity\n.bank/statements today",
    expect: "go to https://verity.bank/statements today",
  },
  {
    name: "leaves ordinary sentences on their own lines",
    raw: "Your card is on its way.\nIt should arrive Friday.",
    expect: "Your card is on its way.\nIt should arrive Friday.",
  },
  {
    name: "leaves an em dash alone",
    raw: "Never share this code —\nwe will never ask for it.",
    expect: "Never share this code —\nwe will never ask for it.",
  },
];

for (const c of ocrCases) {
  const got = tidyOcrText(c.raw);
  if (got !== c.expect) fail(`screenshot: ${c.name}`, [`got: ${JSON.stringify(got)}`, `want: ${JSON.stringify(c.expect)}`]);
  else console.log(`✓ screenshot: ${c.name}`);
}

/* -------------------------------------------------------------- identifier */

const identifierCases: { name: string; value: string; kind: string; verdict: IdentifierVerdict }[] = [
  { name: "our own domain", value: "https://verity.bank/login", kind: "url", verdict: "official" },
  { name: "look-alike domain", value: "verity-secure-login.top", kind: "url", verdict: "suspicious" },
  { name: "shortened link", value: "bit.ly/3xRdlv", kind: "url", verdict: "suspicious" },
  { name: "unrelated domain", value: "https://example.com", kind: "url", verdict: "unrecognised" },
  { name: "our support line", value: "+1 (800) 555-0199", kind: "phone", verdict: "official" },
  { name: "unknown number", value: "+1 202 555 0147", kind: "phone", verdict: "unrecognised" },
  { name: "our email domain", value: "report@verity.bank", kind: "email", verdict: "official" },
  { name: "look-alike email", value: "security@verity-alerts.com", kind: "email", verdict: "suspicious" },
  { name: "nonsense input", value: "hello there", kind: "unknown", verdict: "unknown" },
];

for (const c of identifierCases) {
  const result = checkIdentifier(c.value);
  const problems: string[] = [];
  if (result.kind !== c.kind) problems.push(`kind ${result.kind} ≠ expected ${c.kind}`);
  if (result.verdict !== c.verdict) problems.push(`verdict ${result.verdict} ≠ expected ${c.verdict}`);
  if (problems.length) fail(`check: ${c.name}`, problems);
  else console.log(`✓ check: ${c.name}  (${result.kind}, ${result.verdict})`);
}

/* ---------------------------------------------------------------- catalogue */

/**
 * "What we checked" is shown to customers as a complete list, so a signal the
 * engine can emit but the catalogue doesn't name would be a quiet lie.
 */
const SIGNALS_OUTSIDE_RULES = [
  "link-lookalike", "link-disguised", "link-shortened", "link-risky-tld", "link-unofficial",
  "sender-domain", "crypto-wallet", "payment-destination", "hidden-characters",
  "callback-number", "formatting", "disguised-wording",
];

const catalogued = CHECK_GROUPS.flatMap((g) => g.signalIds);
const everySignal = [...patternRules.map((r) => r.id), ...SIGNALS_OUTSIDE_RULES];
const catalogueProblems: string[] = [];

for (const id of everySignal) if (!catalogued.includes(id)) catalogueProblems.push(`${id} is not in any check group`);
for (const id of catalogued) {
  if (!everySignal.includes(id)) catalogueProblems.push(`${id} is listed but no rule emits it`);
  if (catalogued.filter((c) => c === id).length > 1) catalogueProblems.push(`${id} is listed in more than one group`);
}

if (catalogueProblems.length) fail("catalogue: every signal is published exactly once", [...new Set(catalogueProblems)]);
else console.log(`✓ catalogue: all ${catalogued.length} checks published exactly once`);

const total = cases.length + redactionCases.length + ocrCases.length + identifierCases.length + 1;
console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
