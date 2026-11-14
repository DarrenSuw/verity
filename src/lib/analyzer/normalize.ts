/**
 * Undoes the character tricks scammers use to slip past keyword filters:
 * look-alike letters from other alphabets, invisible characters, digit and
 * symbol substitution ("pa$$w0rd"), and spaced-out words ("p a s s w o r d").
 *
 * The result keeps a map back to the original string so every match can still
 * be highlighted in the exact place the customer sees it.
 */

/** Zero-width, directional and soft-hyphen characters that render as nothing. */
export const INVISIBLE_CHARS = /[­͏؜᠎​-‏‪-‮⁠-⁤⁪-⁯﻿]/;

/** Letters from other alphabets that are visually identical to a Latin letter. */
export const CONFUSABLES: Record<string, string> = {
  // Cyrillic
  а: "a", в: "b", с: "c", ԁ: "d", е: "e", ѕ: "s", һ: "h", і: "i", ј: "j", к: "k",
  ӏ: "l", м: "m", н: "h", о: "o", р: "p", ԛ: "q", г: "r", т: "t", ս: "u", ѵ: "v",
  ԝ: "w", х: "x", у: "y", А: "A", В: "B", С: "C", Е: "E", Н: "H", К: "K", М: "M",
  О: "O", Р: "P", Т: "T", Х: "X", У: "Y", Ѕ: "S", І: "I", Ј: "J",
  // Greek
  ο: "o", α: "a", ε: "e", ι: "i", κ: "k", ν: "v", ρ: "p", τ: "t", υ: "u", χ: "x",
  ϲ: "c", Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H", Ι: "I", Κ: "K", Μ: "M", Ν: "N",
  Ο: "O", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
  // Armenian / Cherokee look-alikes
  ո: "n", օ: "o", Ꭺ: "A", Ꭼ: "E", Ꮋ: "H", Ꮮ: "L", Ꮖ: "T",
  // Fullwidth
  ａ: "a", ｂ: "b", ｃ: "c", ｄ: "d", ｅ: "e", ｆ: "f", ｇ: "g", ｈ: "h", ｉ: "i",
  ｊ: "j", ｋ: "k", ｌ: "l", ｍ: "m", ｎ: "n", ｏ: "o", ｐ: "p", ｑ: "q", ｒ: "r",
  ｓ: "s", ｔ: "t", ｕ: "u", ｖ: "v", ｗ: "w", ｘ: "x", ｙ: "y", ｚ: "z",
};

/** Digit and symbol substitutions, only applied inside words. */
const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
  $: "s", "@": "a", "!": "i", "|": "l", "€": "e",
};

const ASCII_LETTER = /^[A-Za-z]$/;
const TOKEN_CHAR = /^[A-Za-z0-9$@!|€]$/;
/**
 * A single letter followed by a separator, four or more times: "p a s s w o r d".
 * Anchored to word boundaries so it can't absorb the last letter of the word
 * before it, which would corrupt the word being recovered.
 */
const SPACED_LETTERS = /(?<![A-Za-z])(?:[A-Za-z][ .\-_*·•]){3,}[A-Za-z](?![A-Za-z])/g;

export interface Normalized {
  /** Lower-cased text with the tricks undone. */
  text: string;
  /** map[i] is the index in the original string that normalized character i came from. */
  map: number[];
  /** True when anything was actually changed, so matches here are worth flagging. */
  changed: boolean;
}

/** Folds invisible characters and look-alike letters away. */
function foldCharacters(input: string): { chars: string[]; map: number[]; changed: boolean } {
  const chars: string[] = [];
  const map: number[] = [];
  let changed = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (INVISIBLE_CHARS.test(ch)) {
      changed = true;
      continue;
    }
    const folded = CONFUSABLES[ch];
    if (folded) {
      changed = true;
      chars.push(folded);
      map.push(i);
      continue;
    }
    chars.push(ch);
    map.push(i);
  }
  return { chars, map, changed };
}

/**
 * Replaces digits and symbols that stand in for letters, but only inside words
 * that are mostly letters, so "within 24 hours" and "code 482913" are untouched.
 */
function foldLeet(chars: string[]): { chars: string[]; changed: boolean } {
  const out = [...chars];
  let changed = false;

  let i = 0;
  while (i < chars.length) {
    if (!TOKEN_CHAR.test(chars[i])) {
      i++;
      continue;
    }
    let end = i;
    while (end < chars.length && TOKEN_CHAR.test(chars[end])) end++;

    const letters = chars.slice(i, end).filter((c) => ASCII_LETTER.test(c)).length;
    if (letters >= 2) {
      for (let j = i; j < end; j++) {
        const sub = LEET[chars[j]];
        if (!sub) continue;
        const isDigit = /^[0-9]$/.test(chars[j]);
        // Symbols are only folded between two letters, so trailing "!" stays punctuation.
        if (!isDigit && !(hasLetterBefore(chars, j, i) && hasLetterAfter(chars, j, end))) continue;
        out[j] = sub;
        changed = true;
      }
    }
    i = end;
  }
  return { chars: out, changed };
}

function hasLetterBefore(chars: string[], index: number, from: number): boolean {
  for (let i = index - 1; i >= from; i--) {
    if (ASCII_LETTER.test(chars[i])) return true;
    if (!LEET[chars[i]]) return false;
  }
  return false;
}

function hasLetterAfter(chars: string[], index: number, to: number): boolean {
  for (let i = index + 1; i < to; i++) {
    if (ASCII_LETTER.test(chars[i])) return true;
    if (!LEET[chars[i]]) return false;
  }
  return false;
}

/** Joins "p a s s w o r d" back into one word. */
function collapseSpacedLetters(text: string, map: number[]): { text: string; map: number[]; changed: boolean } {
  const matches = [...text.matchAll(SPACED_LETTERS)];
  if (!matches.length) return { text, map, changed: false };

  const chars: string[] = [];
  const nextMap: number[] = [];
  let cursor = 0;

  for (const match of matches) {
    const start = match.index ?? 0;
    for (let i = cursor; i < start; i++) {
      chars.push(text[i]);
      nextMap.push(map[i]);
    }
    for (let i = start; i < start + match[0].length; i++) {
      if (!ASCII_LETTER.test(text[i])) continue;
      chars.push(text[i]);
      nextMap.push(map[i]);
    }
    cursor = start + match[0].length;
  }
  for (let i = cursor; i < text.length; i++) {
    chars.push(text[i]);
    nextMap.push(map[i]);
  }
  return { text: chars.join(""), map: nextMap, changed: true };
}

export function normalize(input: string): Normalized {
  const first = foldCharacters(input);
  const second = foldLeet(first.chars);
  const collapsed = collapseSpacedLetters(second.chars.join(""), first.map);
  return {
    text: collapsed.text.toLowerCase(),
    map: collapsed.map,
    changed: first.changed || second.changed || collapsed.changed,
  };
}

/** Translates a range in the normalized text back to a range in the original. */
export function toOriginalRange(normalized: Normalized, start: number, end: number): { start: number; end: number } | null {
  if (start >= end || start < 0 || end > normalized.map.length) return null;
  return { start: normalized.map[start], end: normalized.map[end - 1] + 1 };
}
