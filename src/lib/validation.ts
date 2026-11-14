import * as z from "zod/v4";
import { MAX_MESSAGE_LENGTH } from "@/lib/analyzer/engine";

export const AnalyzeRequest = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Paste the message you received.")
    .max(MAX_MESSAGE_LENGTH, `Messages are limited to ${MAX_MESSAGE_LENGTH.toLocaleString("en-US")} characters.`),
  channel: z.enum(["sms", "email", "chat", "call"]).default("sms"),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequest>;

export async function parseBody(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false as const, error: "Request body must be JSON." };
  }
  const parsed = AnalyzeRequest.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  return { ok: true as const, data: parsed.data };
}
