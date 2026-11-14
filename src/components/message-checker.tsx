"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AiReview } from "@/lib/ai/review";
import type { AnalysisResult, Channel } from "@/lib/analyzer/types";
import { redactCardNumbers } from "@/lib/redact";
import { samples } from "@/lib/samples";
import { Results } from "./results";
import { ScreenshotInput } from "./screenshot-input";
import { ArrowIcon } from "./ui";

const MAX = 6000;

const CHANNELS: { id: Channel; label: string; placeholder: string }[] = [
  { id: "sms", label: "Text message", placeholder: "Paste the text message exactly as you received it, or paste a screenshot…" },
  { id: "email", label: "Email", placeholder: "Paste the email, including the sender address and subject if you can…" },
  { id: "chat", label: "Chat app", placeholder: "Paste the WhatsApp, Telegram or social media message…" },
  { id: "call", label: "Phone call", placeholder: "Write down what the caller said and asked you to do…" },
];

export type AiState =
  | { status: "off" }
  | { status: "loading" }
  | { status: "done"; review: AiReview }
  | { status: "error"; message: string };

export function MessageChecker({
  aiEnabled,
  message,
  setMessage,
}: {
  aiEnabled: boolean;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [channel, setChannel] = useState<Channel>("sms");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedText, setAnalyzedText] = useState("");
  const [redacted, setRedacted] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiState>({ status: "off" });
  const requestId = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = CHANNELS.find((c) => c.id === channel)!;
  const trimmed = message.trim();
  const canSubmit = trimmed.length > 0 && message.length <= MAX && !pending;

  const runReview = useCallback(async (text: string, ch: Channel, id: number) => {
    setAi({ status: "loading" });
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, channel: ch }),
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      setAi(res.ok ? { status: "done", review: data } : { status: "error", message: data.error ?? "AI review is unavailable." });
    } catch {
      if (id === requestId.current) setAi({ status: "error", message: "AI review is unavailable right now." });
    }
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    const id = ++requestId.current;
    setPending(true);
    setError(null);

    // Card numbers never leave the browser, so they can't be logged anywhere.
    const { text: safe, count } = redactCardNumbers(trimmed);

    if (aiEnabled) void runReview(safe, channel, id);
    else setAi({ status: "off" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: safe, channel }),
      });
      const data = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setAnalyzedText(safe);
      setRedacted(count);
      setResult(data);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      if (id === requestId.current) setError("We couldn’t reach the checker. Check your connection and try again.");
    } finally {
      if (id === requestId.current) setPending(false);
    }
  }, [aiEnabled, canSubmit, channel, runReview, trimmed]);

  const reset = useCallback((keepText: boolean) => {
    requestId.current++;
    setResult(null);
    setAi({ status: "off" });
    setRedacted(0);
    if (!keepText) setMessage("");
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      inputRef.current?.focus();
    });
  }, [setMessage]);

  const addScreenshotText = useCallback(
    (text: string) => {
      setError(null);
      setMessage((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [setMessage],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && document.activeElement === inputRef.current) {
        e.preventDefault();
        void submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  return (
    <div ref={topRef} className="scroll-mt-24">
      {result ? (
        <Results
          result={result}
          text={analyzedText}
          ai={ai}
          aiEnabled={aiEnabled}
          redacted={redacted}
          onReset={() => reset(false)}
          onEdit={() => reset(true)}
        />
      ) : (
        <section
          aria-label="Check a message"
          className="rounded-2xl border border-line bg-bg shadow-[0_1px_0_rgba(14,14,16,0.03),0_12px_40px_-20px_rgba(14,14,16,0.12)]"
        >
          <div className="flex flex-col gap-4 border-b border-line px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <label htmlFor="message" className="text-[13px] font-medium text-ink">
              Where did you receive it?
            </label>
            <div role="radiogroup" aria-label="Channel" className="grid grid-cols-2 gap-1 sm:flex">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={channel === c.id}
                  onClick={() => setChannel(c.id)}
                  className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] transition-colors ${
                    channel === c.id ? "bg-ink text-white" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 sm:px-7">
            <textarea
              id="message"
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={active.placeholder}
              spellCheck={false}
              rows={8}
              className="block min-h-[200px] w-full resize-y bg-transparent py-5 text-[15px] leading-[1.7] text-ink placeholder:text-ink-3/70 focus:outline-none"
              aria-describedby="message-help"
            />
            <div className="pb-4">
              <ScreenshotInput onText={addScreenshotText} disabled={pending} />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mx-5 mb-4 rounded-lg border border-high-line bg-high-bg px-3.5 py-2.5 text-[13px] text-high sm:mx-7"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4 border-t border-line bg-surface/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
              <span className="text-[12px] text-ink-3">Try an example</span>
              {samples.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setMessage(s.text);
                    setChannel(s.channel);
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  className="h-7 rounded-full border border-line bg-bg px-3 text-[12px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className={`font-mono text-[11px] ${message.length > MAX ? "text-high" : "text-ink-3"}`}>
                {message.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")}
              </span>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!canSubmit}
                className="group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-ink pr-4 pl-5 text-[14px] font-medium text-white transition-all hover:bg-black disabled:cursor-not-allowed disabled:bg-ink/25"
              >
                {pending ? "Checking…" : "Check message"}
                <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {!result && (
        <p id="message-help" className="mt-4 px-1 text-[12.5px] leading-relaxed text-ink-3">
          Card numbers are removed in your browser before anything is sent. We don’t store your message.
          <span className="hidden sm:inline"> Press Ctrl + Enter to check.</span>
        </p>
      )}
    </div>
  );
}
