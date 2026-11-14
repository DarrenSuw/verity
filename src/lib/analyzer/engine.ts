import { buildChecks, TOTAL_CHECKS } from "./checks";
import { cryptoWalletSignal, hiddenCharacterSignal, paymentDestinationSignal } from "./detectors";
import { buildRecoverySteps, buildSteps } from "./guidance";
import { assessCoverage } from "./language";
import { emailSignals, extractEmails, extractLinks, extractPhoneNumbers, linkSignals } from "./links";
import { normalize, toOriginalRange, type Normalized } from "./normalize";
import { matchPlaybook } from "./playbooks";
import { patternRules, type PatternRule } from "./rules";
import type { AnalysisResult, Channel, Coverage, RiskLevel, Signal, Span } from "./types";

export const ENGINE_VERSION = "2.0.0";
export const MAX_MESSAGE_LENGTH = 6000;

const SEVERITY_WEIGHT = { high: 40, medium: 18, low: 7 } as const;
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const NEGATION = /\b(?:never|not|no one|nobody|won['’]?t|don['’]?t|do not|will not|cannot|can['’]?t)\b[^.!?\n]{0,30}$/i;

/** Finds every place a rule matches inside one haystack. */
function matchRule(haystack: string, rule: PatternRule): Span[] {
  const spans: Span[] = [];
  for (const pattern of rule.patterns) {
    for (const match of haystack.matchAll(pattern)) {
      const start = match.index ?? 0;
      const value = match[0];
      if (rule.exclude?.test(haystack.slice(start, start + value.length + 40))) continue;
      if (rule.ignoreNegated) {
        const before = haystack.slice(Math.max(0, start - 40), start);
        if (NEGATION.test(before)) continue;
      }
      spans.push({ start, end: start + value.length, text: value });
    }
  }
  return spans;
}

/** Sort, drop exact duplicates, and drop spans fully contained in another span. */
function dedupeSpans(spans: Span[]): Span[] {
  const seen = new Set<string>();
  const unique = spans.filter((s) => {
    const key = `${s.start}:${s.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sorted = unique.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Span[] = [];
  for (const span of sorted) {
    const last = out[out.length - 1];
    if (last && span.start >= last.start && span.end <= last.end) continue;
    out.push(span);
  }
  return out;
}

/**
 * Runs a rule against the message twice: once as written, once with character
 * tricks undone. Spans found only in the second pass are reported back in the
 * original coordinates, and remembered as evidence of deliberate disguise.
 */
function matchRuleBothWays(text: string, normalized: Normalized, rule: PatternRule): { spans: Span[]; evasive: Span[] } {
  const spans = matchRule(text, rule);
  const evasive: Span[] = [];

  if (normalized.changed) {
    for (const span of matchRule(normalized.text, rule)) {
      const range = toOriginalRange(normalized, span.start, span.end);
      if (!range) continue;
      const original = text.slice(range.start, range.end);
      const mapped = { start: range.start, end: range.end, text: original };
      spans.push(mapped);
      if (original.toLowerCase() !== span.text) evasive.push(mapped);
    }
  }

  return { spans: dedupeSpans(spans), evasive };
}

function formattingSignal(text: string): Signal | null {
  const spans: Span[] = [];
  // Runs of shouted words, ignoring short acronyms like "OTP" or "PIN".
  for (const m of text.matchAll(/\b[A-Z]{4,}(?:[\s!.,:]+[A-Z]{2,}){1,}\b/g)) {
    spans.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, text: m[0] });
  }
  for (const m of text.matchAll(/[!?]{2,}/g)) {
    spans.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, text: m[0] });
  }
  if (!spans.length) return null;
  return {
    id: "formatting",
    category: "formatting",
    severity: "low",
    critical: false,
    title: "Shouting or heavy punctuation",
    explanation: "Capital letters and repeated exclamation marks are used to alarm you. Professional services rarely write this way.",
    spans: dedupeSpans(spans),
  };
}

function callbackSignal(text: string, phones: Span[]): Signal | null {
  if (!phones.length) return null;
  const asksToCall = /\b(?:call|ring|phone|dial|contact|text|whatsapp|reach)\b[^.!?\n]{0,40}$/i;
  const asksAfter = /^[^.!?\n]{0,25}\b(?:call|contact|reach)/i;
  const relevant = phones.filter(
    (p) => asksToCall.test(text.slice(Math.max(0, p.start - 60), p.start)) || asksAfter.test(text.slice(p.end, p.end + 30)),
  );
  if (!relevant.length) return null;
  return {
    id: "callback-number",
    category: "contact",
    severity: "medium",
    critical: false,
    title: "Gives you a number to call back",
    explanation:
      "Scammers include their own phone number so that when you “verify”, you reach them. Only use a number you already trust.",
    spans: relevant,
  };
}

/** Fires when a tactic only became visible after undoing character tricks. */
function evasionSignal(spans: Span[]): Signal | null {
  if (!spans.length) return null;
  return {
    id: "disguised-wording",
    category: "evasion",
    severity: "high",
    critical: false,
    title: "Key words are deliberately misspelled",
    explanation:
      "Words are spaced out or written with digits and symbols standing in for letters, so filters don’t recognise them while you still read them normally. Only someone avoiding detection writes this way.",
    spans: dedupeSpans(spans),
  };
}

function riskFromSignals(signals: Signal[]): { risk: RiskLevel; score: number } {
  const raw = signals.reduce((sum, s) => sum + SEVERITY_WEIGHT[s.severity], 0);
  // Several distinct tactics together are more telling than any one alone.
  const categories = new Set(signals.map((s) => s.category)).size;
  const combo = categories >= 3 ? 10 : 0;
  const score = Math.min(100, raw + combo);
  const critical = signals.some((s) => s.critical);

  if (critical || score >= 55) return { risk: "high", score: Math.max(score, critical ? 70 : score) };
  if (score >= 18) return { risk: "medium", score };
  return { risk: "low", score };
}

function copyFor(risk: RiskLevel, count: number, coverage: Coverage): { headline: string; summary: string } {
  const plural = count === 1 ? "" : "s";

  if (risk === "high")
    return {
      headline: "High risk — this looks like a scam",
      summary: `We found ${count} warning sign${plural} that match known scam tactics. Don’t act on this message. Follow the steps below to check safely.`,
    };

  if (risk === "medium")
    return {
      headline: "Suspicious — verify before you act",
      summary: `We found ${count} warning sign${plural}. The message may be genuine, but don’t use any links or numbers in it until you’ve checked independently.`,
    };

  // Low risk is the dangerous case to report: silence must never read as approval.
  if (!coverage.supported)
    return {
      headline: "We couldn’t fully check this message",
      summary: "Our written checks didn’t apply to this message, so we have nothing useful to tell you about its wording. Verify it the safe way instead, using the steps below.",
    };

  return {
    headline: count === 0 ? "No common warning signs found" : "Only minor signs found",
    summary:
      count === 0
        ? "That doesn’t prove it’s genuine. Scams can be well written. If it asks you to do anything, verify it through a channel you trust."
        : "We spotted only minor signs. That doesn’t prove it’s genuine — if it asks you to do anything, verify it through a channel you trust.",
  };
}

export function analyzeMessage(input: string, channel: Channel = "sms"): AnalysisResult {
  const text = input.slice(0, MAX_MESSAGE_LENGTH);
  const normalized = normalize(text);
  const signals: Signal[] = [];
  const evasive: Span[] = [];

  for (const rule of patternRules) {
    const { spans, evasive: disguised } = matchRuleBothWays(text, normalized, rule);
    evasive.push(...disguised);
    if (!spans.length) continue;
    signals.push({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      critical: Boolean(rule.critical),
      title: rule.title,
      explanation: rule.explanation,
      spans,
    });
  }

  const links = extractLinks(text);
  signals.push(...linkSignals(links));

  const emails = extractEmails(text);
  signals.push(...emailSignals(text, emails));

  const protectedSpans = [...links.map((l) => l.span), ...emails.map((e) => e.span)];

  const phoneNumbers = extractPhoneNumbers(text, protectedSpans);
  for (const signal of [
    callbackSignal(text, phoneNumbers),
    cryptoWalletSignal(text, protectedSpans),
    paymentDestinationSignal(text, protectedSpans),
    hiddenCharacterSignal(text),
    evasionSignal(evasive),
    formattingSignal(text),
  ])
    if (signal) signals.push(signal);

  signals.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || Number(b.critical) - Number(a.critical));

  const { risk, score } = riskFromSignals(signals);
  const coverage = assessCoverage(text);
  const { headline, summary } = copyFor(risk, signals.length, coverage);

  return {
    risk,
    score,
    headline,
    summary,
    signals,
    links,
    emails,
    phoneNumbers,
    playbook: risk === "low" ? null : matchPlaybook(signals),
    coverage,
    checks: buildChecks(signals),
    totalChecks: TOTAL_CHECKS,
    steps: buildSteps(signals, channel, risk),
    ifAlreadyActed: buildRecoverySteps(),
    meta: {
      channel,
      characters: text.length,
      analyzedAt: new Date().toISOString(),
      engineVersion: ENGINE_VERSION,
    },
  };
}
