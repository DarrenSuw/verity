/**
 * Regression checks for the rule engine. Run with: npm run test:engine
 * Each case states the risk level and the warning signs we expect.
 */
import { analyzeMessage } from "../src/lib/analyzer/engine";
import { samples } from "../src/lib/samples";
import type { Channel, RiskLevel } from "../src/lib/analyzer/types";

interface Case {
  name: string;
  text: string;
  channel?: Channel;
  risk: RiskLevel;
  mustInclude?: string[];
  mustExclude?: string[];
}

const bySample = Object.fromEntries(samples.map((s) => [s.id, s]));

const cases: Case[] = [
  {
    name: "sample: fraud team SMS",
    text: bySample["fraud-team"].text,
    risk: "high",
    mustInclude: ["credential-request", "link-lookalike", "urgency", "threat", "account-alert", "callback-number", "link-risky-tld"],
  },
  {
    name: "sample: safe account call",
    text: bySample["safe-account"].text,
    channel: "call",
    risk: "high",
    mustInclude: ["safe-account", "secrecy", "remote-access", "impersonation", "threat"],
  },
  {
    name: "sample: parcel redelivery",
    text: bySample["parcel"].text,
    risk: "high",
    mustInclude: ["fee-request", "link-shortened", "delivery", "generic-greeting"],
  },
  {
    name: "sample: genuine OTP is not flagged as a credential request",
    text: bySample["genuine-otp"].text,
    risk: "low",
    mustExclude: ["credential-request"],
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
    mustExclude: ["link-unofficial", "callback-number"],
  },
  {
    name: "email address is not treated as a link",
    text: "Questions? Email help@verity.bank and we'll get back to you.",
    risk: "low",
    mustExclude: ["link-unofficial"],
  },
  {
    name: "app store download is not flagged",
    text: "Download the Verity app from the App Store to manage your card.",
    risk: "low",
    mustExclude: ["install-request", "remote-access"],
  },
];

let failed = 0;
for (const c of cases) {
  const result = analyzeMessage(c.text, c.channel ?? "sms");
  const ids = result.signals.map((s) => s.id);
  const problems: string[] = [];
  if (result.risk !== c.risk) problems.push(`risk ${result.risk} ≠ expected ${c.risk}`);
  for (const id of c.mustInclude ?? []) if (!ids.includes(id)) problems.push(`missing ${id}`);
  for (const id of c.mustExclude ?? []) if (ids.includes(id)) problems.push(`unexpected ${id}`);

  // Every span must point at the exact text it claims to.
  for (const s of result.signals)
    for (const span of s.spans)
      if (c.text.slice(span.start, span.end) !== span.text) problems.push(`bad span in ${s.id}`);

  if (problems.length) {
    failed++;
    console.log(`✗ ${c.name}\n    ${problems.join("\n    ")}\n    got: ${result.risk} [${ids.join(", ")}]`);
  } else {
    console.log(`✓ ${c.name}  (${result.risk}, ${ids.length} signs)`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
