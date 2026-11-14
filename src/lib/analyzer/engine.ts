import { buildRecoverySteps, buildSteps } from "./guidance";
import { extractLinks, extractPhoneNumbers, linkSignals } from "./links";
import { patternRules } from "./rules";
import type { AnalysisResult, Channel, RiskLevel, Signal, Span } from "./types";

export const ENGINE_VERSION = "1.0.0";
export const MAX_MESSAGE_LENGTH = 6000;

const SEVERITY_WEIGHT = { high: 40, medium: 18, low: 7 } as const;
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const NEGATION = /\b(?:never|not|no one|nobody|won['’]?t|don['’]?t|do not|will not|cannot|can['’]?t)\b[^.!?\n]{0,30}$/i;

function matchRule(text: string, rule: (typeof patternRules)[number]): Span[] {
  const spans: Span[] = [];
  for (const pattern of rule.patterns) {
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const value = match[0];
      if (rule.exclude?.test(text.slice(start, start + value.length + 40))) continue;
      if (rule.ignoreNegated) {
        const before = text.slice(Math.max(0, start - 40), start);
        if (NEGATION.test(before)) continue;
      }
      spans.push({ start, end: start + value.length, text: value });
    }
  }
  return dedupeSpans(spans);
}

/** Sort and drop spans fully contained in another span. */
function dedupeSpans(spans: Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Span[] = [];
  for (const span of sorted) {
    const last = out[out.length - 1];
    if (last && span.start >= last.start && span.end <= last.end) continue;
    out.push(span);
  }
  return out;
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

const COPY: Record<RiskLevel, { headline: string; summary: (n: number) => string }> = {
  high: {
    headline: "High risk — this looks like a scam",
    summary: (n) =>
      `We found ${n} warning sign${n === 1 ? "" : "s"} that match known scam tactics. Don’t act on this message. Follow the steps below to check safely.`,
  },
  medium: {
    headline: "Suspicious — verify before you act",
    summary: (n) =>
      `We found ${n} warning sign${n === 1 ? "" : "s"}. The message may be genuine, but don’t use any links or numbers in it until you’ve checked independently.`,
  },
  low: {
    headline: "No common warning signs found",
    summary: (n) =>
      n === 0
        ? "That doesn’t prove it’s genuine. Scams can be well written. If it asks you to do anything, verify it through a channel you trust."
        : "We spotted only minor signs. That doesn’t prove it’s genuine — if it asks you to do anything, verify it through a channel you trust.",
  },
};

export function analyzeMessage(input: string, channel: Channel = "sms"): AnalysisResult {
  const text = input.slice(0, MAX_MESSAGE_LENGTH);
  const signals: Signal[] = [];

  for (const rule of patternRules) {
    const spans = matchRule(text, rule);
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

  const phoneNumbers = extractPhoneNumbers(
    text,
    links.map((l) => l.span),
  );
  const callback = callbackSignal(text, phoneNumbers);
  if (callback) signals.push(callback);

  const formatting = formattingSignal(text);
  if (formatting) signals.push(formatting);

  signals.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || Number(b.critical) - Number(a.critical));

  const { risk, score } = riskFromSignals(signals);

  return {
    risk,
    score,
    headline: COPY[risk].headline,
    summary: COPY[risk].summary(signals.length),
    signals,
    links,
    phoneNumbers,
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
