import { NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analyzer/engine";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 40;
const WINDOW_MS = 60_000;

/**
 * Rule-based analysis. Deterministic, instant, and the message never leaves
 * this server. Nothing is stored or logged.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`analyze:${clientKey(request)}`, LIMIT, WINDOW_MS);
  if (!limit.ok)
    return NextResponse.json(
      { error: "That’s a lot of checks at once. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );

  const body = await parseBody(request);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

  const result = analyzeMessage(body.data.message, body.data.channel);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
