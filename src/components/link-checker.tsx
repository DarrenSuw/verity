"use client";

import { useCallback, useRef, useState } from "react";
import { organization } from "@/config/organization";
import type { IdentifierResult, IdentifierVerdict } from "@/lib/analyzer/identity";
import { ArrowIcon, LINK_NOTE, OfficialContacts, SectionLabel } from "./ui";

const TONE: Record<IdentifierVerdict, { chip: string; text: string; label: string }> = {
  official: { chip: "border-low-line bg-low-bg text-low", text: "text-low", label: "Genuine" },
  suspicious: { chip: "border-high-line bg-high-bg text-high", text: "text-high", label: "Not ours — and imitating us" },
  unrecognised: { chip: "border-medium-line bg-medium-bg text-medium", text: "text-medium", label: "Not ours" },
  unknown: { chip: "border-line bg-surface text-ink-2", text: "text-ink-2", label: "Couldn’t read that" },
};

const KIND_LABEL: Record<IdentifierResult["kind"], string> = {
  url: "Web address",
  phone: "Phone number",
  email: "Email address",
  unknown: "Unrecognised input",
};

/**
 * The quickest form of the question: "is this number/link actually yours?"
 *
 * Answering it needs a deliberately narrow claim. We can prove something is
 * ours; we can never prove an unknown number is safe. So an unrecognised value
 * is reported as unrecognised, with the official contact to use instead.
 */
export function LinkChecker() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<IdentifierResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setResult(null);
        return;
      }
      setResult(data);
    } catch {
      setError("We couldn’t reach the checker. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }, [pending, value]);

  const tone = result ? TONE[result.verdict] : null;

  return (
    <div>
      <section
        aria-label="Check a link, number or address"
        className="rounded-2xl border border-line bg-bg px-5 py-5 shadow-[0_1px_0_rgba(14,14,16,0.03),0_12px_40px_-20px_rgba(14,14,16,0.12)] sm:px-7 sm:py-6"
      >
        <label htmlFor="identifier" className="text-[13px] font-medium text-ink">
          Paste one link, phone number or email address
        </label>
        <p className="mt-1 text-[12.5px] text-ink-3">
          We’ll tell you whether it belongs to {organization.name}. Don’t open a link to check it.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <input
            id="identifier"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="verity-secure-login.top  ·  +1 202 555 0147  ·  alerts@example.com"
            spellCheck={false}
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-5 font-mono text-[13.5px] text-ink placeholder:font-sans placeholder:text-ink-3/70 focus:border-line-strong focus:outline-none"
          />
          <button
            type="submit"
            disabled={!value.trim() || pending}
            className="group inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-full bg-ink pr-4 pl-5 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-ink/25"
          >
            {pending ? "Checking…" : "Check it"}
            <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-high-line bg-high-bg px-3.5 py-2.5 text-[13px] text-high">
            {error}
          </p>
        )}
      </section>

      {result && tone && (
        <section className="rise mt-6" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-[24px] items-center rounded-full border px-2.5 text-[11.5px] font-medium ${tone.chip}`}>
              {tone.label}
            </span>
            <span className="text-[12px] text-ink-3">{KIND_LABEL[result.kind]}</span>
          </div>

          <h2 className={`mt-4 font-display text-[26px] leading-[1.15] sm:text-[30px] ${tone.text}`}>{result.headline}</h2>

          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{result.detail}</p>

          {result.domain && result.domain !== result.value && (
            <p className="mt-4 font-mono text-[12.5px] break-all text-ink-3">
              {result.value} → <span className="text-ink">{result.domain}</span>
            </p>
          )}

          {result.notes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {result.notes.map((n) => (
                <span key={n} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink-2">
                  {LINK_NOTE[n] ?? n}
                </span>
              ))}
            </div>
          )}

          {result.advice.length > 0 && (
            <div className="mt-7">
              <SectionLabel>What to do</SectionLabel>
              <ul className="mt-3 space-y-2.5">
                {result.advice.map((a) => (
                  <li key={a} className="grid grid-cols-[0.75rem_1fr] gap-x-3 text-[14px] leading-relaxed text-ink-2">
                    <span className="mt-[0.6em] size-1.5 rounded-full bg-accent" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <OfficialContacts />
        </section>
      )}
    </div>
  );
}
