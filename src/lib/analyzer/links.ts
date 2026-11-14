import { organization } from "@/config/organization";
import { COMMON_TLDS, HIGH_RISK_TLDS, IMPERSONATED_BRANDS, SHORTENER_DOMAINS } from "./rules";
import type { LinkInsight, Signal, Span } from "./types";

const URL_PATTERN = new RegExp(
  String.raw`(?:\bhttps?:\/\/[^\s<>"'()\[\]{}]+|\bwww\.[^\s<>"'()\[\]{}]+|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:${COMMON_TLDS})\b(?:\/[^\s<>"'()\[\]{}]*)?)`,
  "gi",
);

const PHONE_PATTERN = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{2,4}(?:[\s.-]?\d{2,4}){2,4}\b/g;

const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "or", "ne", "go"]);
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

function trimTrailingPunctuation(raw: string): string {
  return raw.replace(/[.,;:!?)\]}'"’”]+$/u, "");
}

export function registrableDomain(host: string): string {
  if (IPV4.test(host)) return host;
  const labels = host.split(".").filter(Boolean);
  if (labels.length <= 2) return labels.join(".");
  const tld = labels[labels.length - 1];
  const sld = labels[labels.length - 2];
  if (tld.length === 2 && SECOND_LEVEL.has(sld)) return labels.slice(-3).join(".");
  return labels.slice(-2).join(".");
}

function parseHost(raw: string): { host: string; hasUserInfo: boolean; insecure: boolean } {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return {
      host: url.hostname.toLowerCase().replace(/\.$/, ""),
      hasUserInfo: Boolean(url.username || url.password),
      insecure: /^http:\/\//i.test(raw),
    };
  } catch {
    return { host: raw.toLowerCase(), hasUserInfo: false, insecure: false };
  }
}

const officialDomains = new Set<string>(organization.officialDomains.map((d) => d.toLowerCase()));

export function extractLinks(text: string): LinkInsight[] {
  const links: LinkInsight[] = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = trimTrailingPunctuation(match[0]);
    const start = match.index ?? 0;
    // Skip e-mail addresses: "name@example.com" would otherwise match as a domain.
    if (start > 0 && text[start - 1] === "@") continue;

    const { host, hasUserInfo, insecure } = parseHost(raw);
    const domain = registrableDomain(host);
    const official = officialDomains.has(domain);
    const notes: string[] = [];

    if (!official) {
      if (impersonatedBrand(host, domain)) notes.push("lookalike");
      if (SHORTENER_DOMAINS.has(domain)) notes.push("shortener");
      if (IPV4.test(host)) notes.push("ip");
      if (host.includes("xn--")) notes.push("punycode");
      if (hasUserInfo) notes.push("userinfo");
      const tld = host.split(".").pop() ?? "";
      if (HIGH_RISK_TLDS.has(tld)) notes.push("risky-tld");
      if (insecure) notes.push("insecure");
      if (host.split(".").length > 4) notes.push("deep-subdomain");
    }

    links.push({ url: raw, host, domain, official, notes, span: { start, end: start + raw.length, text: raw } });
  }
  return links;
}

/** Returns the brand name a host is pretending to be, if any. */
export function impersonatedBrand(host: string, domain: string): string | null {
  const flat = host.replace(/[^a-z0-9]/g, "");
  for (const keyword of organization.brandKeywords) {
    if (flat.includes(keyword.toLowerCase()) && !officialDomains.has(domain)) return organization.name;
  }
  for (const [brand, domains] of Object.entries(IMPERSONATED_BRANDS)) {
    if (flat.includes(brand) && !domains.includes(domain)) return brand;
  }
  return null;
}

export function extractPhoneNumbers(text: string, exclude: Span[]): Span[] {
  const spans: Span[] = [];
  for (const match of text.matchAll(PHONE_PATTERN)) {
    const start = match.index ?? 0;
    const value = match[0].trim();
    const digits = value.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) continue;
    // Ignore digits that are part of a link, amounts like 1,250.00 or dates.
    if (exclude.some((s) => start >= s.start && start < s.end)) continue;
    if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?$/.test(value)) continue;
    if (/^\d{1,4}[./-]\d{1,2}[./-]\d{1,4}$/.test(value)) continue;
    spans.push({ start, end: start + value.length, text: value });
  }
  return spans;
}

export function linkSignals(links: LinkInsight[]): Signal[] {
  const signals: Signal[] = [];
  const pick = (note: string) => links.filter((l) => l.notes.includes(note)).map((l) => l.span);

  const lookalike = links.filter((l) => l.notes.includes("lookalike"));
  if (lookalike.length) {
    const brand = impersonatedBrand(lookalike[0].host, lookalike[0].domain) ?? organization.name;
    const brandLabel = brand === organization.name ? organization.name : brand.charAt(0).toUpperCase() + brand.slice(1);
    signals.push({
      id: "link-lookalike",
      category: "link",
      severity: "high",
      critical: true,
      title: `Link pretends to be ${brandLabel}`,
      explanation: `The address uses the name “${brandLabel}”, but the site actually belongs to ${lookalike
        .map((l) => l.domain)
        .join(", ")}. Impostors build look-alike addresses to steal logins.`,
      spans: lookalike.map((l) => l.span),
    });
  }

  const disguised = [...pick("ip"), ...pick("punycode"), ...pick("userinfo")];
  if (disguised.length) {
    signals.push({
      id: "link-disguised",
      category: "link",
      severity: "high",
      critical: true,
      title: "Link disguises where it really goes",
      explanation:
        "The address uses a raw number, hidden characters or a misleading “@” trick so it looks like one site but opens another.",
      spans: disguised,
    });
  }

  const shortened = pick("shortener");
  if (shortened.length) {
    signals.push({
      id: "link-shortened",
      category: "link",
      severity: "medium",
      critical: false,
      title: "Uses a shortened link",
      explanation: "Short links hide the real destination, so you can’t tell where it will take you before you tap.",
      spans: shortened,
    });
  }

  const risky = pick("risky-tld");
  if (risky.length) {
    signals.push({
      id: "link-risky-tld",
      category: "link",
      severity: "medium",
      critical: false,
      title: "Link ends in an unusual web address",
      explanation:
        "Endings like .top, .xyz or .click are cheap and rarely used by established companies, but very common in scams.",
      spans: risky,
    });
  }

  const unfamiliar = links.filter(
    (l) => !l.official && !l.notes.some((n) => ["lookalike", "ip", "punycode", "userinfo"].includes(n)),
  );
  if (unfamiliar.length) {
    signals.push({
      id: "link-unofficial",
      category: "link",
      severity: "medium",
      critical: false,
      title: `Link doesn’t go to an official ${organization.name} website`,
      explanation: `Our only website is ${organization.website}. Any other address in a message claiming to be from us should be treated as unsafe.`,
      spans: unfamiliar.map((l) => l.span),
    });
  }

  return signals;
}
