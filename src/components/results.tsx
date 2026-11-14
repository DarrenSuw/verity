"use client";

import { useMemo, useState } from "react";
import { organization } from "@/config/organization";
import type { AnalysisResult, Channel, CheckOutcome, EmailInsight, LinkInsight, Playbook, RiskLevel } from "@/lib/analyzer/types";
import { buildReportText, buildSpokenText } from "@/lib/report";
import { ResultActions } from "./actions";
import type { AiState } from "./message-checker";
import { HighlightedMessage } from "./highlighted-message";
import { AlertIcon, LINK_NOTE, OfficialContacts, RISK_LABEL, RiskMeter, SectionLabel, SeverityTag } from "./ui";

const CHANNEL_LABEL: Record<Channel, string> = {
  sms: "Text message",
  email: "Email",
  chat: "Chat app",
  call: "Phone call notes",
};

const RISK_TEXT: Record<RiskLevel, string> = { high: "text-high", medium: "text-medium", low: "text-low" };

export function Results({
  result,
  text,
  ai,
  aiEnabled,
  redacted,
  onReset,
  onEdit,
}: {
  result: AnalysisResult;
  text: string;
  ai: AiState;
  aiEnabled: boolean;
  redacted: number;
  onReset: () => void;
  onEdit: () => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const counts = {
    high: result.signals.filter((s) => s.severity === "high").length,
    medium: result.signals.filter((s) => s.severity === "medium").length,
    low: result.signals.filter((s) => s.severity === "low").length,
  };
  const reportText = useMemo(() => buildReportText(result, text), [result, text]);
  const spokenText = useMemo(() => buildSpokenText(result), [result]);

  return (
    <div className="rise grid gap-8 lg:grid-cols-12 lg:gap-12">
      {/* Message column */}
      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-line bg-bg">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <SectionLabel>Your message</SectionLabel>
              <span className="text-[12px] text-ink-3">{CHANNEL_LABEL[result.meta.channel]}</span>
            </div>
            <div className="max-h-[52vh] overflow-y-auto px-5 py-5 print:max-h-none print:overflow-visible">
              <HighlightedMessage text={text} signals={result.signals} activeId={activeId} onActivate={setActiveId} />
            </div>
            {result.signals.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-[11.5px] text-ink-3">
                <Legend tone="bg-high" label="Serious" />
                <Legend tone="bg-medium" label="Caution" />
                <Legend tone="bg-line-strong" label="Minor" />
                <span className="ml-auto hidden sm:inline print:hidden">Hover a highlight to see why</span>
              </div>
            )}
          </div>

          {redacted > 0 && (
            <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-ink-3">
              <AlertIcon className="mt-[0.15em] size-3.5 text-accent" />
              <span>
                We removed {redacted} card number{redacted === 1 ? "" : "s"} in your browser before checking. It was never sent
                to us.
              </span>
            </p>
          )}

          <div className="mt-4 flex gap-2 print:hidden">
            <button
              type="button"
              onClick={onReset}
              className="h-10 flex-1 rounded-full bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-black"
            >
              Check another message
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="h-10 rounded-full border border-line px-4 text-[13px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              Edit
            </button>
          </div>

          <div className="mt-3">
            <ResultActions reportText={reportText} spokenText={spokenText} />
          </div>
        </div>
      </aside>

      {/* Findings column */}
      <div className="min-w-0 space-y-12 lg:col-span-7">
        {!result.coverage.supported && (
          <div className="flex gap-3 rounded-2xl border border-medium-line bg-medium-bg px-5 py-4">
            <AlertIcon className="mt-0.5 text-medium" />
            <div>
              <p className="text-[14px] font-medium text-medium">Limited check</p>
              <p className="mt-1 max-w-[58ch] text-[13.5px] leading-relaxed text-ink-2">{result.coverage.note}</p>
            </div>
          </div>
        )}

        <section aria-live="polite">
          <div className="flex items-center gap-3">
            <RiskMeter risk={result.risk} />
            <span className={`text-[12px] font-medium tracking-[0.14em] uppercase ${RISK_TEXT[result.risk]}`}>
              {RISK_LABEL[result.risk]}
            </span>
          </div>
          <h2 className="mt-4 font-display text-[28px] leading-[1.15] text-ink sm:text-[34px]">{result.headline}</h2>
          <p className="mt-4 max-w-[60ch] text-[15.5px] leading-relaxed text-ink-2">{result.summary}</p>
          {result.signals.length > 0 && (
            <dl className="mt-6 flex divide-x divide-line rounded-xl border border-line">
              <Stat label="Serious" value={counts.high} tone={counts.high ? "text-high" : "text-ink-3"} />
              <Stat label="Caution" value={counts.medium} tone={counts.medium ? "text-medium" : "text-ink-3"} />
              <Stat label="Minor" value={counts.low} tone="text-ink-3" />
            </dl>
          )}
        </section>

        {result.playbook && <PlaybookCard playbook={result.playbook} />}

        {result.signals.length > 0 && (
          <section>
            <SectionLabel count={result.signals.length}>Warning signs</SectionLabel>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {result.signals.map((s) => (
                <li
                  key={s.id}
                  id={`signal-${s.id}`}
                  onMouseEnter={() => setActiveId(s.id)}
                  onMouseLeave={() => setActiveId(null)}
                  className={`-mx-3 scroll-mt-28 rounded-lg px-3 py-5 transition-colors ${activeId === s.id ? "bg-surface" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[15.5px] font-medium text-ink">{s.title}</h3>
                    <SeverityTag severity={s.severity} />
                  </div>
                  <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">{s.explanation}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.spans.slice(0, 4).map((span) => (
                      <q
                        key={span.start}
                        className="max-w-full truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-[11.5px] text-ink-2"
                      >
                        {span.text}
                      </q>
                    ))}
                    {s.spans.length > 4 && (
                      <span className="px-1 py-1 text-[11.5px] text-ink-3">+{s.spans.length - 4} more</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.links.length > 0 && <LinkInspector links={result.links} />}
        {result.emails.length > 0 && <EmailInspector emails={result.emails} />}

        <section>
          <SectionLabel>How to check safely</SectionLabel>
          <ol className="mt-5 space-y-6">
            {result.steps.map((step, i) => (
              <li key={step.id} className="grid grid-cols-[2rem_1fr] gap-x-3">
                <span className="font-display text-[15px] leading-6 text-accent">{i + 1}</span>
                <div>
                  <h3 className="text-[15.5px] font-medium text-ink">{step.title}</h3>
                  <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <OfficialContacts />
        </section>

        {aiEnabled && <AiReviewCard ai={ai} />}

        <ChecksPanel checks={result.checks} total={result.totalChecks} found={result.signals.length} />

        <details className="group rounded-2xl border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14.5px] font-medium text-ink">
            Already replied, clicked or paid?
            <span className="text-ink-3 transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <ul className="space-y-4 border-t border-line px-5 py-5">
            {result.ifAlreadyActed.map((step) => (
              <li key={step.id}>
                <h3 className="text-[14px] font-medium text-ink">{step.title}</h3>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">{step.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-1.5 rounded-full ${tone}`} />
      {label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex-1 px-4 py-3">
      <dt className="text-[11.5px] text-ink-3">{label}</dt>
      <dd className={`mt-1 font-display text-[24px] leading-none ${tone}`}>{value}</dd>
    </div>
  );
}

function PlaybookCard({ playbook }: { playbook: Playbook }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <div className="border-b border-line bg-surface px-5 py-3.5">
        <SectionLabel>Known scam pattern</SectionLabel>
      </div>
      <div className="px-5 py-5">
        <h3 className="font-display text-[21px] leading-tight text-ink">{playbook.name}</h3>
        {playbook.alsoKnownAs && <p className="mt-1 text-[12.5px] text-ink-3">Also called {playbook.alsoKnownAs}</p>}
        <p className="mt-3 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-2">{playbook.description}</p>

        <p className="mt-6 text-[12px] font-medium tracking-[0.14em] text-ink-3 uppercase">What usually happens next</p>
        <ol className="mt-3 space-y-3">
          {playbook.nextMoves.map((move, i) => (
            <li key={move} className="grid grid-cols-[1.25rem_1fr] gap-x-2.5 text-[14px] leading-relaxed text-ink-2">
              <span className="font-mono text-[11.5px] leading-6 text-accent">{String(i + 1).padStart(2, "0")}</span>
              {move}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function LinkInspector({ links }: { links: LinkInsight[] }) {
  return (
    <section>
      <SectionLabel count={links.length}>Where the links really go</SectionLabel>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.span.start} className="rounded-xl border border-line px-4 py-3.5">
            <p className="truncate font-mono text-[12px] text-ink-3" title={l.url}>
              {l.url}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-[14px] text-ink">
                Opens a site owned by <span className="font-medium">{l.domain}</span>
              </p>
              {l.official ? (
                <span className="rounded-full border border-low-line bg-low-bg px-2 py-0.5 text-[11px] font-medium text-low">
                  Official {organization.name} domain
                </span>
              ) : (
                l.notes.map((n) => (
                  <span key={n} className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-ink-2">
                    {LINK_NOTE[n] ?? n}
                  </span>
                ))
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12.5px] text-ink-3">
        Don’t open these to check them. Even an official-looking link is safer reached through the app.
      </p>
    </section>
  );
}

function EmailInspector({ emails }: { emails: EmailInsight[] }) {
  return (
    <section>
      <SectionLabel count={emails.length}>Email addresses in this message</SectionLabel>
      <ul className="mt-4 space-y-2">
        {emails.map((e) => (
          <li key={e.span.start} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line px-4 py-3">
            <p className="font-mono text-[12.5px] break-all text-ink">{e.address}</p>
            {e.official ? (
              <span className="rounded-full border border-low-line bg-low-bg px-2 py-0.5 text-[11px] font-medium text-low">
                Official {organization.name} domain
              </span>
            ) : (
              <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-ink-2">
                Not ours — {e.domain}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChecksPanel({ checks, total, found }: { checks: CheckOutcome[]; total: number; found: number }) {
  return (
    <details className="group rounded-2xl border border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
        <span className="text-[14.5px] font-medium text-ink">
          What we checked
          <span className="ml-2 font-mono text-[12px] font-normal text-ink-3">
            {found} of {total} checks matched
          </span>
        </span>
        <span className="text-ink-3 transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5">
        <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className={c.triggered ? "font-medium text-ink" : "text-ink-2"}>{c.label}</span>
              <span className={`shrink-0 font-mono text-[11.5px] ${c.triggered ? "text-high" : "text-ink-3"}`}>
                {c.triggered ? `${c.triggered} found` : "clear"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[12.5px] leading-relaxed text-ink-3">
          Every check is a fixed rule, run on your message in this order, with no scoring by an outside service. “Clear” means
          that rule didn’t match — not that the message is safe.
        </p>
      </div>
    </details>
  );
}

const AI_VERDICT: Record<string, { label: string; tone: string }> = {
  likely_scam: { label: "Likely a scam", tone: "text-high border-high-line bg-high-bg" },
  suspicious: { label: "Suspicious", tone: "text-medium border-medium-line bg-medium-bg" },
  no_clear_signs: { label: "No clear signs", tone: "text-low border-low-line bg-low-bg" },
};

function AiReviewCard({ ai }: { ai: AiState }) {
  return (
    <section className="rounded-2xl border border-line">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <SectionLabel>Second opinion</SectionLabel>
        <span className="text-[11.5px] text-ink-3">AI review</span>
      </div>
      <div className="px-5 py-5">
        {ai.status === "loading" && (
          <div className="space-y-2.5" aria-label="AI review loading">
            <div className="skeleton h-5 w-28" />
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-4/5" />
          </div>
        )}
        {ai.status === "error" && <p className="text-[13.5px] text-ink-3">{ai.message} The checks above still apply.</p>}
        {ai.status === "done" && (
          <div className="rise">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-[24px] items-center rounded-full border px-2.5 text-[12px] font-medium ${AI_VERDICT[ai.review.verdict].tone}`}
              >
                {AI_VERDICT[ai.review.verdict].label}
              </span>
              <span className="text-[12px] text-ink-3">{ai.review.confidence} confidence</span>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink">{ai.review.summary}</p>
            {ai.review.signals.length > 0 && (
              <ul className="mt-4 space-y-3">
                {ai.review.signals.map((s, i) => (
                  <li key={i} className="border-l border-line-strong pl-3.5">
                    <p className="text-[13.5px] font-medium text-ink">{s.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{s.explanation}</p>
                    {s.quote && <q className="mt-1 block font-mono text-[11.5px] text-ink-3">{s.quote}</q>}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
              <span className="font-medium text-ink">Safe check: </span>
              {ai.review.safe_check}
            </p>
            <p className="mt-4 text-[11.5px] text-ink-3">AI can make mistakes. The steps above always apply.</p>
          </div>
        )}
      </div>
    </section>
  );
}
