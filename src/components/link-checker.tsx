"use client";

import { useCallback, useRef, useState } from "react";
import { organization } from "@/config/organization";
import type { IdentifierResult, IdentifierVerdict } from "@/lib/analyzer/identity";
import { ArrowIcon, LINK_NOTE, OfficialContacts, SectionLabel } from "./ui";

/**
 * Green here means "we verified this is ours", never "this seems fine".
 * An unrecognised value gets the neutral-to-amber treatment, because we can
 * prove something is ours but never prove an unknown number is safe.
 */
const TONE: Record<IdentifierVerdict, { chip: string; text: string; label: string }> = {
  official: { chip: "border-accent/25 bg-accent-wash text-accent-strong", text: "text-accent-strong", label: "Verified as ours" },
  suspicious: { chip: "border-high-line bg-high-bg text-high", text: "text-high", label: "Not ours, and imitating us" },
  unrecognised: { chip: "border-medium-line bg-medium-bg text-medium", text: "text-medium", label: "Not ours" },
  unknown: { chip: "border-line bg-surface text-ink-2", text: "text-ink-2", label: "Couldn’t read that" },
};

const KIND_LABEL: Record<IdentifierResult["kind"], string> = {
  url: "Web address",
  phone: "Phone number",
  email: "Email address",
  unknown: "Unrecognised input",
};

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
        className="overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_1px_2px_rgba(24,35,28,0.04),0_16px_48px_-28px_rgba(24,35,28,0.18)]"
      >
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <label htmlFor="identifier" className="text-[13.5px] font-medium text-ink">
            Paste one link, phone number or email address
          </label>
          <p className="mt-1.5 text-[13px] text-ink-3">
            We will tell you whether it belongs to {organization.name}. Don’t open a link to check it.
          </p>
          <form
            className="mt-5 flex flex-col gap-2.5 sm:flex-row"
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
              placeholder="verity-secure-login.top"
              spellCheck={false}
              autoComplete="off"
              inputMode="url"
              className="h-12 min-w-0 flex-1 rounded-full border border-line bg-bg px-5 font-mono text-[13.5px] text-ink placeholder:font-sans placeholder:text-ink-3 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!value.trim() || pending}
              className="group inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-full bg-accent pr-4 pl-5 text-[14.5px] font-medium text-white transition-colors hover:bg-accent-strong active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3"
            >
              {pending ? "Checking…" : "Check it"}
              <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-high-line bg-high-bg px-4 py-3 text-[13.5px] text-high">
              {error}
            </p>
          )}
        </div>

        <p className="border-t border-line bg-surface px-5 py-3 text-[12px] text-ink-3 sm:px-7">
          Checked against the domains and numbers {organization.name} actually owns. Nothing is stored.
        </p>
      </section>

      {result && tone && (
        <section className="rise mt-6 rounded-2xl border border-line bg-bg px-5 py-6 sm:px-7 sm:py-7" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex h-[26px] items-center rounded-full border px-3 text-[11.5px] font-medium ${tone.chip}`}>
              {tone.label}
            </span>
            <span className="text-[12px] text-ink-3">{KIND_LABEL[result.kind]}</span>
          </div>

          <h2 className={`mt-5 font-display text-[25px] leading-[1.14] sm:text-[30px] ${tone.text}`}>{result.headline}</h2>

          <p className="mt-3.5 max-w-[62ch] text-[15px] leading-[1.7] text-ink-2">{result.detail}</p>

          {result.domain && result.domain !== result.value && (
            <p className="mt-5 rounded-xl bg-surface px-4 py-3 font-mono text-[12.5px] break-all text-ink-3">
              {result.value}
              <span className="px-2 text-ink-3" aria-label="resolves to">
                &rarr;
              </span>
              <span className="text-ink">{result.domain}</span>
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
            <div className="mt-8">
              <SectionLabel>What to do</SectionLabel>
              <ul className="mt-3.5 space-y-3">
                {result.advice.map((a) => (
                  <li key={a} className="grid grid-cols-[14px_1fr] gap-x-3 text-[14.5px] leading-relaxed text-ink-2">
                    <span className="mt-[0.55em] size-[7px] rounded-[2px] bg-accent-bright" aria-hidden />
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
