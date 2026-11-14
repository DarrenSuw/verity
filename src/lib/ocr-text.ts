/**
 * Repairs text recovered from a screenshot.
 *
 * Phones wrap long links across lines, so a screenshot of
 * "https://verity-secure-login.top/verify" arrives split in two. Left alone,
 * the link checker would read a truncated domain and get the most important
 * answer on the page wrong.
 */

/** A line that ends mid-link, with no space before the break. */
const UNFINISHED_URL = /(?:https?:\/\/|www\.)\S*$/i;
/** Characters a link can continue with on the next line. */
const URL_CONTINUATION = /^[a-z0-9/._~%?#&=+-]/i;

export function repairWrappedText(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const previous = out[out.length - 1];
    const joinable = previous !== undefined && URL_CONTINUATION.test(line);

    // A hyphen at a line end is a wrap, not punctuation — an em dash would be.
    if (joinable && (/-$/.test(previous) || UNFINISHED_URL.test(previous))) {
      out[out.length - 1] = previous + line.trimStart();
      continue;
    }
    out.push(line);
  }

  return out.join("\n");
}

/** Tidies spacing without losing the paragraph breaks that aid reading. */
export function tidyOcrText(raw: string): string {
  return repairWrappedText(raw)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
