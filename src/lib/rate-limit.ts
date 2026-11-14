/**
 * Per-instance sliding-window limiter for the public endpoints.
 *
 * The analyzer is unauthenticated by design, because a worried customer should
 * not have to log in first, so it needs a ceiling. State lives in memory, which
 * means each serverless instance enforces its own window; that is enough to
 * stop casual abuse of a free endpoint. A shared store would be the next step
 * if this ran behind a single origin.
 */

const hits = new Map<string, number[]>();
/** Stop the map growing without bound on a long-lived instance. */
const MAX_KEYS = 5_000;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the next request would be allowed. */
  retryAfter: number;
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (hits.size > MAX_KEYS) hits.clear();

  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.ceil((recent[0] + windowMs - now) / 1000), remaining: 0 };
  }

  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfter: 0, remaining: limit - recent.length };
}

/** Best available caller identity behind a proxy. Never logged or stored. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
