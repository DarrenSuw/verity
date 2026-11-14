"use client";

import { Fragment, useMemo } from "react";
import type { Severity, Signal } from "@/lib/analyzer/types";

interface Segment {
  start: number;
  end: number;
  signalIds: string[];
  severity: Severity | null;
}

const RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

/** Splits the message into non-overlapping runs, each tagged with the signals covering it. */
function segment(text: string, signals: Signal[]): Segment[] {
  const bounds = new Set<number>([0, text.length]);
  for (const s of signals)
    for (const span of s.spans) {
      bounds.add(Math.max(0, Math.min(text.length, span.start)));
      bounds.add(Math.max(0, Math.min(text.length, span.end)));
    }
  const points = [...bounds].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) continue;
    const covering = signals.filter((s) => s.spans.some((sp) => sp.start <= start && sp.end >= end));
    const severity = covering.reduce<Severity | null>(
      (best, s) => (!best || RANK[s.severity] > RANK[best] ? s.severity : best),
      null,
    );
    segments.push({ start, end, signalIds: covering.map((s) => s.id), severity });
  }
  return segments;
}

export function HighlightedMessage({
  text,
  signals,
  activeId,
  onActivate,
}: {
  text: string;
  signals: Signal[];
  activeId: string | null;
  onActivate: (id: string | null) => void;
}) {
  const segments = useMemo(() => segment(text, signals), [text, signals]);
  const titles = useMemo(() => Object.fromEntries(signals.map((s) => [s.id, s.title])), [signals]);

  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.75] text-ink">
      {segments.map((seg) => {
        const value = text.slice(seg.start, seg.end);
        if (!seg.severity) return <Fragment key={seg.start}>{value}</Fragment>;
        const primary = seg.signalIds[0];
        return (
          <mark
            key={seg.start}
            className={`sig sig-${seg.severity}`}
            data-active={activeId !== null && seg.signalIds.includes(activeId)}
            title={seg.signalIds.map((id) => titles[id]).join(" · ")}
            onMouseEnter={() => onActivate(primary)}
            onMouseLeave={() => onActivate(null)}
            onClick={() => {
              onActivate(primary);
              document.getElementById(`signal-${primary}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            {value}
          </mark>
        );
      })}
    </p>
  );
}
