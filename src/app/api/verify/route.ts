import { NextResponse } from "next/server";
import { checkIdentifier } from "@/lib/analyzer/identity";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseWith, VerifyRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 60;
const WINDOW_MS = 60_000;

/** Checks a single link, phone number or email address against our own records. */
export async function POST(request: Request) {
  const limit = rateLimit(`verify:${clientKey(request)}`, LIMIT, WINDOW_MS);
  if (!limit.ok)
    return NextResponse.json(
      { error: "That’s a lot of checks at once. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );

  const body = await parseWith(VerifyRequest, request);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

  return NextResponse.json(checkIdentifier(body.data.value), { headers: { "Cache-Control": "no-store" } });
}
