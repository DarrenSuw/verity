import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { aiEnabled, reviewWithAI } from "@/lib/ai/review";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Optional AI second opinion. Returns 404 when AI is not configured. */
export async function POST(request: Request) {
  if (!aiEnabled()) return NextResponse.json({ error: "AI review is not enabled." }, { status: 404 });

  // Tighter than the rule engine: this one costs money per call.
  const limit = rateLimit(`review:${clientKey(request)}`, 10, 60_000);
  if (!limit.ok)
    return NextResponse.json(
      { error: "AI review is rate limited. Wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );

  const body = await parseBody(request);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

  try {
    const review = await reviewWithAI(body.data.message, body.data.channel);
    if (!review) return NextResponse.json({ error: "The AI review couldn’t complete for this message." }, { status: 422 });
    return NextResponse.json(review, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "AI review is busy. Try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[review] AI provider credentials rejected");
      return NextResponse.json({ error: "AI review is unavailable." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[review] AI provider error ${error.status}`);
      return NextResponse.json({ error: "AI review is unavailable." }, { status: 502 });
    }
    console.error("[review] unexpected error");
    return NextResponse.json({ error: "AI review is unavailable." }, { status: 500 });
  }
}
