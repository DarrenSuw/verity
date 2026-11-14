/**
 * The published list of everything the engine looks for.
 *
 * A customer who is told "no warning signs found" deserves to see what was
 * actually checked, and anyone auditing the tool can read the whole surface in
 * one place. Every signal id the engine can emit belongs to exactly one group.
 */
import type { CheckOutcome, Signal } from "./types";

export const CHECK_GROUPS: { id: string; label: string; signalIds: string[] }[] = [
  { id: "codes", label: "Requests for codes, PINs and passwords", signalIds: ["credential-request"] },
  {
    id: "money",
    label: "Requests to move, send or pay money",
    signalIds: ["safe-account", "unusual-payment", "fee-request", "payment-destination", "crypto-wallet"],
  },
  { id: "access", label: "Remote access, downloads and attachments", signalIds: ["remote-access", "install-request", "attachment"] },
  {
    id: "links",
    label: "Where links and QR codes really go",
    signalIds: ["link-lookalike", "link-disguised", "link-shortened", "link-risky-tld", "link-unofficial", "quishing"],
  },
  { id: "identity", label: "Who the message claims to be from", signalIds: ["impersonation", "sender-domain", "new-number"] },
  { id: "pressure", label: "Pressure, deadlines and threats", signalIds: ["urgency", "threat"] },
  { id: "alerts", label: "Account and security alerts", signalIds: ["account-alert"] },
  { id: "isolation", label: "Attempts to isolate or redirect you", signalIds: ["secrecy", "channel-switch", "callback-number"] },
  { id: "bait", label: "Prizes, refunds and parcels", signalIds: ["prize", "delivery"] },
  { id: "evasion", label: "Hidden characters and filter evasion", signalIds: ["hidden-characters", "disguised-wording"] },
  { id: "style", label: "Writing style and greeting", signalIds: ["formatting", "generic-greeting"] },
];

export const TOTAL_CHECKS = CHECK_GROUPS.reduce((n, g) => n + g.signalIds.length, 0);

export function buildChecks(signals: Signal[]): CheckOutcome[] {
  const found = new Set(signals.map((s) => s.id));
  return CHECK_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    checks: g.signalIds.length,
    triggered: g.signalIds.filter((id) => found.has(id)).length,
  }));
}
