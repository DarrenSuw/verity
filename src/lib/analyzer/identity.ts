/**
 * Checks one link, phone number or email address on its own.
 *
 * This is the question customers actually ask, "is this really you?", and it
 * needs answering without pasting a whole message. The answer is deliberately
 * careful: we can prove something *is* ours, but never that an unknown number
 * is safe, so an unrecognised value is reported as unrecognised, not as clean.
 */
import { organization } from "@/config/organization";
import { impersonatedBrand, inspectUrl, registrableDomain } from "./links";

export type IdentifierKind = "url" | "phone" | "email" | "unknown";
export type IdentifierVerdict = "official" | "suspicious" | "unrecognised" | "unknown";

export interface IdentifierResult {
  kind: IdentifierKind;
  /** What we understood the input to be, cleaned up for display. */
  value: string;
  /** The registrable domain, for a link or address. */
  domain: string | null;
  verdict: IdentifierVerdict;
  headline: string;
  detail: string;
  notes: string[];
  advice: string[];
}

const EMAIL = /^[a-z0-9._%+'-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i;
const URLISH = /^(?:https?:\/\/|www\.)|^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#].*)?$/i;
const PHONEISH = /^[+()\d][\d\s().-]{5,}$/;

const digitsOf = (value: string) => value.replace(/\D/g, "");
const officialDigits = digitsOf(organization.supportPhone);

/** Serious findings mean "suspicious"; the rest only mean "not ours". */
const SUSPICIOUS_NOTES = new Set(["lookalike", "ip", "punycode", "userinfo", "shortener", "risky-tld"]);

export function checkIdentifier(input: string): IdentifierResult {
  const value = input.trim().replace(/\s+/g, " ");

  const email = value.match(EMAIL);
  if (email) return checkEmail(value, email[1].toLowerCase());
  if (PHONEISH.test(value) && digitsOf(value).length >= 6) return checkPhone(value);
  if (URLISH.test(value)) return checkUrl(value);

  return {
    kind: "unknown",
    value,
    domain: null,
    verdict: "unknown",
    headline: "That doesn’t look like a link, number or address",
    detail: "Paste a single web address, phone number or email address. To check a whole message, use the Message tab.",
    notes: [],
    advice: [],
  };
}

function checkUrl(value: string): IdentifierResult {
  const { host, domain, official, notes } = inspectUrl(value);
  const suspicious = notes.some((n) => SUSPICIOUS_NOTES.has(n));

  if (official)
    return {
      kind: "url",
      value,
      domain,
      verdict: "official",
      headline: `This is a genuine ${organization.name} address`,
      detail: `${domain} is a domain we own. It is still safer to reach your account by typing ${organization.website} yourself or opening ${organization.appName}, because a link can be made to display one address and open another.`,
      notes,
      advice: [`Type ${organization.website} rather than tapping a link, even this one.`],
    };

  const brand = impersonatedBrand(host, domain);
  return {
    kind: "url",
    value,
    domain,
    verdict: suspicious ? "suspicious" : "unrecognised",
    headline: suspicious
      ? brand
        ? `This address imitates ${brand === organization.name ? organization.name : brand}`
        : "This address is built to hide where it goes"
      : `This is not a ${organization.name} address`,
    detail: suspicious
      ? `Whatever the link says, it opens a site owned by ${domain}. That is not us.`
      : `${domain} is not a domain we own, so this link is not from us. It may still belong to another legitimate company, but nothing from ${organization.name} will ever ask you to sign in there.`,
    notes,
    advice: [
      "Don’t open it to check. A page can look identical to the real one.",
      `If a message told you to use it, report the message to ${organization.reportEmail}.`,
    ],
  };
}

function checkEmail(value: string, host: string): IdentifierResult {
  const domain = registrableDomain(host);
  const official = (organization.officialDomains as readonly string[]).includes(domain);
  const brand = impersonatedBrand(host, domain);

  if (official)
    return {
      kind: "email",
      value,
      domain,
      verdict: "official",
      headline: `This address belongs to ${organization.name}`,
      detail: `${domain} is ours. Remember that a sender name and address can both be forged in an email, so a matching address alone doesn’t prove a message is genuine.`,
      notes: [],
      advice: ["If the message asks for a code, a payment or a password, it isn’t from us whatever the address says."],
    };

  return {
    kind: "email",
    value,
    domain,
    verdict: brand ? "suspicious" : "unrecognised",
    headline: brand ? "This address imitates a known name" : `This is not a ${organization.name} address`,
    detail: brand
      ? `The name in front is familiar, but the domain behind it, ${domain}, belongs to someone else.`
      : `We send email from ${organization.website} only. ${domain} is not ours.`,
    notes: [],
    advice: [
      "Don’t reply. A reply confirms your address is real and reaches the sender.",
      `Forward it to ${organization.reportEmail} instead, then delete it.`,
    ],
  };
}

function checkPhone(value: string): IdentifierResult {
  const digits = digitsOf(value);
  const matchesOfficial =
    digits.endsWith(officialDigits.slice(-10)) || officialDigits.endsWith(digits.slice(-10));

  if (matchesOfficial)
    return {
      kind: "phone",
      value,
      domain: null,
      verdict: "official",
      headline: "This is our published number",
      detail: `${organization.supportPhone} is the number printed on your card and statements. Note that a caller ID showing this number proves nothing. Displayed numbers can be forged, so hang up and dial it yourself.`,
      notes: [],
      advice: ["If someone called you from this number, call it back yourself rather than trusting the display."],
    };

  return {
    kind: "phone",
    value,
    domain: null,
    verdict: "unrecognised",
    headline: "We can’t confirm this number is ours",
    detail: `Our only published support line is ${organization.supportPhone}. We don’t publish other numbers, and we never ask you to call a number we sent you in a message.`,
    notes: [],
    advice: [
      `Call ${organization.supportPhone} instead, or the number on the back of your card.`,
      "Wait a minute before calling back, or use another phone. A scammer can stay on a line you think you hung up.",
    ],
  };
}
