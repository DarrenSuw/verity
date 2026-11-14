import { organization } from "@/config/organization";
import type { RiskLevel, Severity } from "@/lib/analyzer/types";

/**
 * Shared primitives.
 *
 * Shape rule for the whole product, applied without exception: panels and
 * cards are rounded-2xl, rows and chips are rounded-xl, anything you press is
 * a full pill.
 */

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "Serious",
  medium: "Caution",
  low: "Minor",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Suspicious",
  low: "Nothing found",
};

const TONE: Record<Severity, string> = {
  high: "text-high bg-high-bg border-high-line",
  medium: "text-medium bg-medium-bg border-medium-line",
  low: "text-ink-2 bg-surface border-line",
};

/** Plain-language names for the findings a link inspection can produce. */
export const LINK_NOTE: Record<string, string> = {
  lookalike: "Imitates a known name",
  shortener: "Hides real destination",
  ip: "Raw number address",
  punycode: "Hidden look-alike letters",
  userinfo: "Misleading “@” trick",
  "risky-tld": "Unusual ending",
  insecure: "Not encrypted",
  "deep-subdomain": "Buried in sub-addresses",
};

export function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full border px-2.5 text-[11px] font-medium tracking-[0.04em] uppercase ${TONE[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

/** Small uppercase label. Used sparingly: the page allows two in total. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 text-[11.5px] font-medium tracking-[0.16em] text-ink-3 uppercase">
      <span className="size-[7px] rounded-[2px] bg-accent-bright" aria-hidden />
      {children}
    </p>
  );
}

export function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-[11.5px] font-medium tracking-[0.14em] text-ink-3 uppercase">{children}</h2>
      {count !== undefined && <span className="tnum font-mono text-[11.5px] text-ink-3">{count}</span>}
    </div>
  );
}

export function RiskMeter({ risk }: { risk: RiskLevel }) {
  const filled = risk === "high" ? 3 : risk === "medium" ? 2 : 1;
  const color = risk === "high" ? "bg-high" : risk === "medium" ? "bg-medium" : "bg-line-strong";
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-[3px] w-7 rounded-full ${i <= filled ? color : "bg-line"}`} />
      ))}
    </div>
  );
}

/**
 * The one place the customer should look instead of the message. It appears
 * on every result, which is the point: the safe route is always in reach.
 */
export function OfficialContacts() {
  const rows = [
    { label: "Website", value: organization.website, hint: "Type it in yourself" },
    { label: "Phone", value: organization.supportPhone, hint: "Also on the back of your card" },
    { label: "Report a scam", value: organization.reportEmail, hint: "Forward the message here" },
  ];
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
      <p className="border-b border-line px-5 py-3 text-[12.5px] font-medium text-ink">Our official contacts</p>
      <dl className="grid gap-px bg-line sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="bg-surface px-5 py-4">
            <dt className="text-[11.5px] text-ink-3">{r.label}</dt>
            <dd className="mt-1 font-mono text-[13px] break-all text-ink">{r.value}</dd>
            <dd className="mt-1 text-[11.5px] text-ink-3">{r.hint}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Icon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 shrink-0 ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const SoundIcon = () => (
  <Icon>
    <path d="M8.5 2.5 5 5.5H2.5v5H5l3.5 3V2.5Z" />
    <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.9 3.3a6.5 6.5 0 0 1 0 9.4" />
  </Icon>
);

export const StopIcon = () => (
  <Icon>
    <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
  </Icon>
);

export const CopyIcon = () => (
  <Icon>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <path d="m3 8.5 3.2 3.2L13 4.8" />
  </Icon>
);

export const PrintIcon = () => (
  <Icon>
    <path d="M4.5 6V2.5h7V6M4.5 12H3a.5.5 0 0 1-.5-.5v-4A1.5 1.5 0 0 1 4 6h8a1.5 1.5 0 0 1 1.5 1.5v4a.5.5 0 0 1-.5.5h-1.5" />
    <rect x="4.5" y="9.5" width="7" height="4" rx=".5" />
  </Icon>
);

export const AlertIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M8 2.8 1.9 13.2h12.2L8 2.8Z" />
    <path d="M8 6.6v3M8 11.4h.01" />
  </Icon>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="7" cy="7" r="4.2" />
    <path d="m10.2 10.2 3.3 3.3" />
  </Icon>
);

export const ChatIcon = () => (
  <Icon>
    <path d="M13.5 8.8c0 2.4-2.5 4.3-5.5 4.3-.7 0-1.3-.1-1.9-.3l-3.6 1 1-2.6c-.6-.7-1-1.5-1-2.4 0-2.4 2.5-4.3 5.5-4.3s5.5 1.9 5.5 4.3Z" />
  </Icon>
);

export const ImageIcon = () => (
  <Icon>
    <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
    <circle cx="6" cy="6.3" r="1" />
    <path d="m3.2 11.4 2.9-2.6 2.2 1.9 2-1.7 2.4 2.1" />
  </Icon>
);

export const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Icon>
);

export const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <Icon className={className}>
    <path d="M8 1.75 2.75 3.5v4.1c0 3.1 2.2 5.6 5.25 6.65 3.05-1.05 5.25-3.55 5.25-6.65V3.5L8 1.75Z" />
    <path d="m5.75 8 1.6 1.6 2.9-3.1" />
  </Icon>
);
