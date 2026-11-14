/**
 * Detectors that need more than a keyword match: disguised characters,
 * cryptocurrency wallets and payment destinations.
 */
import { CONFUSABLES, INVISIBLE_CHARS } from "./normalize";
import type { Signal, Span } from "./types";

const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}­͏​-‏⁠-⁤﻿]*/gu;
const HAS_ASCII_LETTER = /[A-Za-z]/;

/**
 * Flags words that mix Latin letters with look-alike letters from another
 * alphabet, or that contain invisible characters. Both are deliberate attempts
 * to look like a normal word while reading as something else to a filter.
 * A message written entirely in another alphabet is not flagged.
 */
export function hiddenCharacterSignal(text: string): Signal | null {
  const spans: Span[] = [];
  let invisible = false;
  let mixedScript = false;

  for (const match of text.matchAll(WORD)) {
    const word = match[0];
    const hasInvisible = [...word].some((c) => INVISIBLE_CHARS.test(c));
    const hasConfusable = [...word].some((c) => CONFUSABLES[c] !== undefined);
    if (!hasInvisible && !(hasConfusable && HAS_ASCII_LETTER.test(word))) continue;
    invisible = invisible || hasInvisible;
    mixedScript = mixedScript || hasConfusable;
    const start = match.index ?? 0;
    spans.push({ start, end: start + word.length, text: word });
  }

  if (!spans.length) return null;
  const what = invisible && mixedScript ? "invisible characters and look-alike letters" : invisible ? "invisible characters" : "look-alike letters from another alphabet";
  return {
    id: "hidden-characters",
    category: "evasion",
    severity: "high",
    critical: true,
    title: "Words contain disguised characters",
    explanation: `Some words use ${what}. They look normal to you but read as something else to a spam filter. Legitimate messages have no reason to do this.`,
    spans,
  };
}

const WALLET_PATTERNS = [
  /\b(?:bc1|tb1)[a-z0-9]{25,62}\b/g,
  /\b[13][1-9A-HJ-NP-Za-km-z]{25,34}\b/g,
  /\b0x[a-fA-F0-9]{40}\b/g,
  /\bT[1-9A-HJ-NP-Za-km-z]{33}\b/g,
  /\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b/g,
];

/** A wallet address in a message is a payment destination that can never be reversed. */
export function cryptoWalletSignal(text: string, exclude: Span[]): Signal | null {
  const spans: Span[] = [];
  for (const pattern of WALLET_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      if (exclude.some((s) => start >= s.start && start < s.end)) continue;
      spans.push({ start, end: start + match[0].length, text: match[0] });
    }
  }
  if (!spans.length) return null;
  return {
    id: "crypto-wallet",
    category: "payment",
    severity: "high",
    critical: true,
    title: "Contains a cryptocurrency wallet address",
    explanation:
      "Crypto payments cannot be recalled, traced back or refunded. No genuine provider will ever ask you to send crypto to resolve an account problem.",
    spans,
  };
}

const IBAN = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{3,4}){3,7}\b/g;
const ACCOUNT_LABEL =
  /\b(?:account (?:number|no\.?|#)|acct\.?(?: number| no\.?)?|a\/c(?: no\.?| number)?|sort code|routing (?:number|no\.?)|iban|swift|bsb)\b[^.!?\n]{0,24}?\d(?:[\d\s.-]{5,})/gi;

/** Genuine alerts tell you to check your account; they never hand you one to pay into. */
export function paymentDestinationSignal(text: string, exclude: Span[]): Signal | null {
  const spans: Span[] = [];
  const push = (start: number, value: string) => {
    if (exclude.some((s) => start >= s.start && start < s.end)) return;
    spans.push({ start, end: start + value.length, text: value });
  };

  for (const match of text.matchAll(IBAN)) {
    const value = match[0];
    const digits = value.replace(/\D/g, "").length;
    // Real IBANs are 15-34 characters and mostly digits after the country code.
    if (value.replace(/\s/g, "").length < 15 || digits < 6) continue;
    push(match.index ?? 0, value);
  }
  for (const match of text.matchAll(ACCOUNT_LABEL)) {
    push(match.index ?? 0, match[0].trimEnd());
  }

  if (!spans.length) return null;
  return {
    id: "payment-destination",
    category: "payment",
    severity: "medium",
    critical: false,
    title: "Gives you an account to pay into",
    explanation:
      "A message that supplies bank details for you to pay is asking you to send money to a stranger. Never set up a payment from details you were sent.",
    spans,
  };
}
