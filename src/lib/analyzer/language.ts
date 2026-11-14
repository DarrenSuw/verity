/**
 * Works out whether the written rules can meaningfully read this message.
 *
 * The patterns are English. Telling someone "no warning signs found" about a
 * message we cannot read would be worse than saying nothing, so the engine
 * reports its own coverage and the interface withholds any reassurance.
 */
import type { Coverage } from "./types";

const SCRIPTS: { id: string; label: string; pattern: RegExp }[] = [
  { id: "cyrillic", label: "Cyrillic", pattern: /[Ѐ-ӿ]/ },
  { id: "arabic", label: "Arabic", pattern: /[؀-ۿݐ-ݿࢠ-ࣿ]/ },
  { id: "han", label: "Chinese", pattern: /[㐀-䶿一-鿿豈-﫿]/ },
  { id: "kana", label: "Japanese", pattern: /[぀-ヿ]/ },
  { id: "hangul", label: "Korean", pattern: /[ᄀ-ᇿ가-힯]/ },
  { id: "thai", label: "Thai", pattern: /[฀-๿]/ },
  { id: "devanagari", label: "Devanagari", pattern: /[ऀ-ॿ]/ },
  { id: "bengali", label: "Bengali", pattern: /[ঀ-৿]/ },
  { id: "tamil", label: "Tamil", pattern: /[஀-௿]/ },
  { id: "hebrew", label: "Hebrew", pattern: /[֐-׿]/ },
  { id: "greek", label: "Greek", pattern: /[Ͱ-Ͽ]/ },
];

const LATIN = /[A-Za-zÀ-ɏ]/;

/** Frequent English function words. Density is a reliable proxy for "this is English". */
const STOPWORDS = new Set([
  "the", "to", "you", "your", "and", "is", "of", "a", "in", "for", "we", "on", "be",
  "have", "has", "had", "will", "this", "that", "it", "at", "with", "from", "not",
  "are", "was", "our", "please", "if", "do", "does", "can", "by", "as", "an", "or",
  "but", "all", "been", "now", "my", "me", "i", "he", "she", "they", "there", "their",
  "what", "when", "which", "who", "out", "up", "about", "into", "than", "then", "so",
  "more", "most", "some", "any", "just", "only", "also", "how", "very", "too", "over",
  "after", "before", "us", "am", "were", "would", "should", "could", "may", "must",
  "get", "got", "make", "made", "need", "want", "know", "see", "take", "within",
  "here", "his", "her", "them", "its", "because", "while", "each", "other", "both",
]);

/** Below this many words there is too little text to judge the language. */
const MIN_WORDS = 8;
const MIN_STOPWORD_RATIO = 0.12;

export function assessCoverage(text: string): Coverage {
  const letters = [...text].filter((c) => /\p{L}/u.test(c));

  if (letters.length) {
    const counts = SCRIPTS.map((s) => ({ ...s, n: letters.filter((c) => s.pattern.test(c)).length }));
    const latin = letters.filter((c) => LATIN.test(c)).length;
    const top = counts.reduce((best, c) => (c.n > best.n ? c : best), { id: "", label: "", n: 0, pattern: LATIN });

    if (top.n > latin && top.n / letters.length > 0.2) {
      return {
        supported: false,
        script: top.label,
        note: `This message is mostly written in ${top.label} script. Our written checks only cover English, so treat the result below as incomplete — no warning signs here does not mean the message is safe.`,
      };
    }
  }

  const words = text.toLowerCase().match(/[a-z']{2,}/g) ?? [];
  if (words.length >= MIN_WORDS) {
    const hits = words.filter((w) => STOPWORDS.has(w)).length;
    if (hits / words.length < MIN_STOPWORD_RATIO) {
      return {
        supported: false,
        script: null,
        note: "This message doesn’t look like English, and our written checks only cover English. Treat the result below as incomplete — no warning signs here does not mean the message is safe.",
      };
    }
  }

  return { supported: true, script: null, note: null };
}
