import type { RiskLevel, Severity } from "@/lib/analyzer/types";

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Serious",
  medium: "Caution",
  low: "Minor",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Suspicious",
  low: "Low risk",
};

const TONE: Record<Severity, string> = {
  high: "text-high bg-high-bg border-high-line",
  medium: "text-medium bg-medium-bg border-medium-line",
  low: "text-ink-2 bg-surface border-line",
};

export function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full border px-2 text-[11px] font-medium tracking-wide uppercase ${TONE[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-[12px] font-medium tracking-[0.14em] text-ink-3 uppercase">{children}</h2>
      {count !== undefined && <span className="font-mono text-[12px] text-ink-3">{count}</span>}
    </div>
  );
}

export function RiskMeter({ risk }: { risk: RiskLevel }) {
  const filled = risk === "high" ? 3 : risk === "medium" ? 2 : 1;
  const color = risk === "high" ? "bg-high" : risk === "medium" ? "bg-medium" : "bg-low";
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1 w-8 rounded-full ${i <= filled ? color : "bg-line"}`} />
      ))}
    </div>
  );
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`size-4 ${className}`} aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={`size-4 ${className}`} aria-hidden>
      <path
        d="M8 1.75 2.75 3.5v4.1c0 3.1 2.2 5.6 5.25 6.65 3.05-1.05 5.25-3.55 5.25-6.65V3.5L8 1.75Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="m5.75 8 1.6 1.6 2.9-3.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
