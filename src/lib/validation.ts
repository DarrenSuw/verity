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

export const VerifyRequest = z.object({
  value: z
    .string()
    .trim()
    .min(1, "Enter a link, phone number or email address.")
    .max(300, "That’s longer than any address or number. Check a whole message in the Message tab."),
});

export type VerifyRequest = z.infer<typeof VerifyRequest>;

export async function parseWith<T extends z.ZodType>(
  schema: T,
  request: Request,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; error: string }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false as const, error: "Request body must be JSON." };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  return { ok: true as const, data: parsed.data };
}

export const parseBody = (request: Request) => parseWith(AnalyzeRequest, request);
