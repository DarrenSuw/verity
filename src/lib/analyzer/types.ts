export type Severity = "high" | "medium" | "low";

export type RiskLevel = "high" | "medium" | "low";

export type Channel = "sms" | "email" | "chat" | "call";

export type SignalCategory =
  | "credentials"
  | "payment"
  | "remote-access"
  | "secrecy"
  | "link"
  | "urgency"
  | "threat"
  | "account-alert"
  | "impersonation"
  | "contact"
  | "prize"
  | "delivery"
  | "greeting"
  | "formatting";

export interface Span {
  start: number;
  end: number;
  text: string;
}

export interface Signal {
  id: string;
  category: SignalCategory;
  severity: Severity;
  /** Short, plain-language name of the warning sign. */
  title: string;
  /** Why this matters, written for a customer, not an analyst. */
  explanation: string;
  /** Exact places in the message that triggered this sign. */
  spans: Span[];
  /** Critical signs push the verdict to high risk on their own. */
  critical: boolean;
}

export interface LinkInsight {
  url: string;
  host: string;
  /** The part of the address that decides who owns the site, e.g. "example.co.uk". */
  domain: string;
  official: boolean;
  notes: string[];
  span: Span;
}

export interface GuidanceStep {
  id: string;
  title: string;
  detail: string;
}

export interface AnalysisResult {
  risk: RiskLevel;
  score: number;
  headline: string;
  summary: string;
  signals: Signal[];
  links: LinkInsight[];
  phoneNumbers: Span[];
  steps: GuidanceStep[];
  ifAlreadyActed: GuidanceStep[];
  meta: {
    channel: Channel;
    characters: number;
    analyzedAt: string;
    engineVersion: string;
  };
}
