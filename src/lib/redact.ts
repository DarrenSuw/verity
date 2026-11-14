/**
 * Strips card numbers out of a message before it is sent anywhere.
 *
 * People paste messages whole, and a scam message often already contains the
 * details they typed into a fake form. A fraud tool that collects card numbers
 * as a side effect would be its own hazard, so this runs in the browser,
 * before the request, and the customer is told it happened.
 */

const CANDIDATE = /\b(?:\d[ -]?){12,18}\d\b/g;
/** Visa, Mastercard, Amex, Discover and friends. Excludes plain reference numbers. */
const CARD_PREFIX = /^[3-6]/;

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export interface Redaction {
  text: string;
  count: number;
}

export function redactCardNumbers(input: string): Redaction {
  let count = 0;
  const text = input.replace(CANDIDATE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return match;
    if (!CARD_PREFIX.test(digits) || !passesLuhn(digits)) return match;
    count++;
    return "[card number removed]";
  });
  return { text, count };
}
