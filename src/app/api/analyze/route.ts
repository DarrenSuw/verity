import { NextResponse } from "next/server";
import { analyzeMessage } from "@/lib/analyzer/engine";
import { parseBody } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rule-based analysis. Deterministic, instant, and the message never leaves
 * this server. Nothing is stored or logged.
 */
export async function POST(request: Request) {
  const body = await parseBody(request);
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: 400 });

  const result = analyzeMessage(body.data.message, body.data.channel);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
