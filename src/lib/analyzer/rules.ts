import type { Severity, SignalCategory } from "./types";

export interface PatternRule {
  id: string;
  category: SignalCategory;
  severity: Severity;
  critical?: boolean;
  title: string;
  explanation: string;
  patterns: RegExp[];
  /**
   * Skip matches preceded by a negation such as "we will never ask for your PIN".
   * Genuine messages often contain exactly that sentence.
   */
  ignoreNegated?: boolean;
  /** Matches are ignored when this matches the match text or the 40 characters after it. */
  exclude?: RegExp;
}

/**
 * Text patterns for well-documented social-engineering tactics.
 * Every pattern must use the global + case-insensitive flags so we can collect
 * all match positions for highlighting.
 */
export const patternRules: PatternRule[] = [
  {
    id: "credential-request",
    category: "credentials",
    severity: "high",
    critical: true,
    ignoreNegated: true,
    title: "Asks for a code, PIN or password",
    explanation:
      "Real support staff never ask for one-time codes, PINs, passwords or full card details. Anyone who has them can take over your account.",
    patterns: [
      /\b(?:send|share|provide|give|tell|read(?: out)?|reply(?: with)?|forward|enter|confirm|verify|type|submit|disclose)\b[^.!?\n]{0,40}?\b(?:otp|one[- ]time (?:pass(?:word|code)|code|pin)|verification code|security code|auth(?:entication)? code|\d[- ]digit code|pin(?: number)?|password|passcode|cvv|cvc|card (?:number|details)|login (?:details|credentials)|online banking (?:details|password)|seed phrase|recovery phrase|secret (?:code|words))\b/gi,
      /\b(?:the|that) code (?:we|you) (?:just )?(?:sent|received)\b/gi,
    ],
  },
  {
    id: "safe-account",
    category: "payment",
    severity: "high",
    critical: true,
    title: "Asks you to move money to a “safe” account",
    explanation:
      "There is no such thing as a safe or holding account. Your provider will never ask you to move money to protect it.",
    patterns: [
      /\b(?:safe|safety|secure|protected|holding|temporary) account\b/gi,
      /\b(?:transfer|move|send|wire)\b[^.!?\n]{0,30}\b(?:your )?(?:funds|money|balance|savings)\b[^.!?\n]{0,30}\b(?:to protect|for safety|to keep (?:it|them) safe|safe)\b/gi,
    ],
  },
  {
    id: "unusual-payment",
    category: "payment",
    severity: "high",
    critical: true,
    title: "Asks for payment by gift card, crypto or money transfer",
    explanation:
      "Gift cards, cryptocurrency and money-transfer services are almost impossible to reverse, which is why scammers ask for them.",
    patterns: [
      /\b(?:gift ?cards?|itunes cards?|google play cards?|steam cards?|apple cards?|bitcoin|btc|usdt|ethereum|crypto(?:currency)?|western union|moneygram)\b/gi,
    ],
  },
  {
    id: "fee-request",
    category: "payment",
    severity: "medium",
    title: "Asks you to pay a fee to receive something",
    explanation:
      "Paying a small fee to release a refund, parcel or prize is a classic way to capture your card details.",
    patterns: [
      /\b(?:processing|release|clearance|unlock(?:ing)?|activation|delivery|customs|redelivery|handling|admin(?:istration)?) (?:fee|charge|payment)\b/gi,
      /\bpay (?:a|the) (?:small|one[- ]time|nominal|minor) (?:fee|amount|charge)\b/gi,
    ],
  },
  {
    id: "remote-access",
    category: "remote-access",
    severity: "high",
    critical: true,
    title: "Asks you to install an app or share your screen",
    explanation:
      "Remote-access apps let a stranger see and control your device, including your banking app. Support will not ask you to install one.",
    patterns: [
      /\b(?:anydesk|teamviewer|quick ?support|rustdesk|ultraviewer|supremo|screen ?shar(?:e|ing)|remote (?:access|desktop|control|support app))\b/gi,
      /\.apk\b/gi,
    ],
  },
  {
    id: "install-request",
    category: "remote-access",
    severity: "medium",
    title: "Asks you to download something",
    explanation:
      "Only install apps from your phone’s official app store, and only ones you went looking for yourself, never from a link in a message.",
    patterns: [/\b(?:install|download)\b[^.!?\n]{0,25}\b(?:app|apk|application|software|tool|file|attachment)\b/gi],
    exclude: /\b(?:app store|play store|google play)\b/i,
  },
  {
    id: "quishing",
    category: "link",
    severity: "high",
    title: "Asks you to scan a QR code",
    explanation:
      "A QR code hides its destination completely. You cannot read where it goes before you scan it. Never scan a code sent to you to log in or pay.",
    patterns: [
      /\b(?:scan (?:the |this |below |attached |following )?(?:qr|bar) ?code|qr ?code (?:below|attached|above)|scan (?:the )?code (?:below|to (?:pay|verify|log ?in|confirm|continue)))\b/gi,
    ],
    exclude: /\bin (?:the |our |your )?[a-z]{0,12} ?app\b/i,
  },
  {
    id: "attachment",
    category: "remote-access",
    severity: "medium",
    title: "Asks you to open an attachment",
    explanation:
      "Attachments in unexpected messages carry malware or lead to a fake login page. Open documents only when you were already expecting them.",
    patterns: [
      /\b(?:open|view|review|check|see|download|print) (?:the |your |this |attached )?(?:attach(?:ed|ment)|enclosed (?:file|document|invoice)|attached (?:file|document|invoice|statement|receipt|form))\b/gi,
      /\b(?:invoice|statement|receipt|document|voicemail|fax) (?:is )?attached\b/gi,
    ],
  },
  {
    id: "new-number",
    category: "impersonation",
    severity: "medium",
    title: "Claims to be someone you know on a new number",
    explanation:
      "Impostors replace a number you trust with one they control, then ask for money or codes. Call the person on the number you already have before replying.",
    patterns: [
      /\b(?:my new (?:number|phone)|i(?:['’]ve| have) (?:got )?(?:a )?new (?:number|phone)|lost my phone|broke my phone|my phone (?:is |got |was )?(?:broken|damaged|smashed|stolen)|(?:texting|messaging|writing) (?:you )?from (?:a |my )?(?:new|borrowed|friend['’]?s) phone|save my new number)\b/gi,
      /\b(?:hi|hello|hey) (?:mum|mom|mummy|mommy|dad|daddy|son|daughter)\b[,\s]/gi,
    ],
  },
  {
    id: "secrecy",
    category: "secrecy",
    severity: "high",
    critical: true,
    title: "Tells you to keep it secret",
    explanation:
      "Scammers isolate you so no one can warn you. A genuine provider will never tell you to hide a conversation from family or branch staff.",
    patterns: [
      /\b(?:do(?:n['’]?t| not)|never|not to) (?:tell|inform|share this with|discuss (?:this|it) with|mention (?:this|it) to|contact|call|speak to|talk to) (?:anyone|anybody|anyone else|your (?:bank|family|branch|friends?|partner|mum|mom|dad|parents|husband|wife)|the bank|bank staff|branch staff|staff|the branch|mum|mom|dad|grandma|grandad)\b/gi,
      /\bkeep (?:this|it|our conversation) (?:confidential|secret|between us|private|to yourself)\b/gi,
    ],
  },
  {
    id: "urgency",
    category: "urgency",
    severity: "medium",
    title: "Creates a sense of urgency",
    explanation:
      "Pressure to act fast is designed to stop you from thinking or checking. Genuine issues can wait for you to verify.",
    patterns: [
      /\b(?:urgent(?:ly)?|immediately|right away|asap|act now|final (?:notice|warning|reminder)|last (?:chance|warning|reminder)|time[- ]sensitive|today only|as soon as possible|without delay)\b/gi,
      /\bwithin (?:the next )?(?:\d+|one|two|three|twelve|twenty[- ]four|forty[- ]eight) ?(?:hours?|hrs?|minutes?|mins?|days?)\b/gi,
      /\b(?:expires?|expiring) (?:today|tonight|soon)\b/gi,
      /\bbefore (?:midnight|it['’]?s too late|the end of (?:the )?day|end of day)\b/gi,
    ],
  },
  {
    id: "threat",
    category: "threat",
    severity: "medium",
    title: "Threatens a penalty if you don’t act",
    explanation:
      "Threats of suspension, fines or legal action are used to frighten you into acting before checking.",
    patterns: [
      /\b(?:will|shall|may|could) be (?:permanently )?(?:suspended|locked|blocked|closed|terminated|deactivated|frozen|restricted|disabled|deleted|cancell?ed)\b/gi,
      /\b(?:account|card|access|profile|service) (?:has been|is|was|is now) (?:temporarily )?(?:suspended|locked|blocked|restricted|frozen|on hold|compromised|limited|disabled)\b/gi,
      /\b(?:legal action|arrest(?: warrant)?|warrant|court (?:action|case|summons)|prosecution|a fine of|be fined|penalt(?:y|ies))\b/gi,
    ],
  },
  {
    id: "account-alert",
    category: "account-alert",
    severity: "medium",
    title: "Claims there is a problem with your account",
    explanation:
      "An unexpected alert about “unusual activity” is the most common opening line. Check it yourself in the official app instead of replying.",
    patterns: [
      /\b(?:unusual|suspicious|unauthori[sz]ed|irregular|fraudulent) (?:activity|log ?in|sign[- ]in|transactions?|access|attempts?|payments?|charges?)\b/gi,
      /\b(?:verify|confirm|update|validate|re-?activate|unlock|restore|secure) (?:your )?(?:account|identity|details|information|card|payment (?:details|method|information)|billing(?: details)?|profile)\b/gi,
      /\bwe (?:have )?detected\b/gi,
    ],
  },
  {
    id: "impersonation",
    category: "impersonation",
    severity: "low",
    title: "Claims to be from support or a security team",
    explanation:
      "Anyone can write “support” or “fraud team” in a message or caller ID. A title alone proves nothing about who sent it.",
    patterns: [
      /\b(?:customer (?:support|service|care)|support (?:team|desk|centre|center|agent)|help ?desk|fraud (?:department|team|prevention|unit|desk)|security (?:team|department|unit|desk|centre|center)|technical support|tech support|account (?:team|department|manager)|(?:bank|official) (?:representative|officer|agent)|it department|billing (?:department|team))\b/gi,
    ],
  },
  {
    id: "channel-switch",
    category: "contact",
    severity: "medium",
    title: "Moves you to WhatsApp, Telegram or a private reply",
    explanation:
      "Moving the conversation to a personal chat app takes it away from official, monitored channels.",
    patterns: [
      /\b(?:whatsapp|telegram|signal app|wechat|viber)\b/gi,
      /\breply (?:to this (?:message|number|email) )?with (?:your|the)\b/gi,
    ],
  },
  {
    id: "prize",
    category: "prize",
    severity: "medium",
    title: "Offers a prize, refund or reward you weren’t expecting",
    explanation:
      "Unexpected money is bait. If it sounds too good to be true, it is designed to make you click without thinking.",
    patterns: [
      /\byou(?:['’]ve| have)? (?:won|been selected|been chosen)\b/gi,
      /\bcongratulations\b/gi,
      /\bclaim (?:your|the|a) (?:prize|reward|refund|gift|compensation|winnings|bonus|cash)\b/gi,
      /\b(?:lottery|jackpot|unclaimed (?:funds|refund|prize|parcel|money))\b/gi,
      /\b(?:eligible|entitled|approved) for (?:a |an )?(?:refund|reward|compensation|rebate|grant)\b/gi,
    ],
  },
  {
    id: "delivery",
    category: "delivery",
    severity: "medium",
    title: "Says a parcel or payment is on hold",
    explanation:
      "Fake delivery problems are used to get you to click a link and enter card details for a “redelivery fee”.",
    patterns: [
      /\b(?:parcel|package|delivery|shipment|order)\b[^.!?\n]{0,40}\b(?:held|on hold|failed|pending|unable to deliver|could not be delivered|couldn['’]?t be delivered|reschedule|redeliver(?:y)?|returned)\b/gi,
    ],
  },
  {
    id: "generic-greeting",
    category: "greeting",
    severity: "low",
    title: "Uses a generic greeting",
    explanation:
      "Mass scam messages can’t address you by name. Note: a message that does use your name can still be fake.",
    patterns: [
      /\b(?:dear (?:valued |esteemed )?(?:customer|client|user|member|account ?holder|card ?holder|sir(?:\/| or )madam|sir|madam|beneficiary|friend)|hello (?:customer|user|dear)|attention (?:customer|user))\b/gi,
    ],
  },
];

/** URL shorteners hide the real destination. */
export const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rb.gy",
  "cutt.ly", "s.id", "shorturl.at", "tiny.cc", "rebrand.ly", "t.ly", "v.gd",
  "lnkd.in", "bl.ink", "short.io", "qrco.de", "urlz.fr", "shorturl.asia",
]);

/** TLDs heavily over-represented in phishing reports. */
export const HIGH_RISK_TLDS = new Set([
  "xyz", "top", "click", "live", "icu", "buzz", "zip", "mov", "cfd", "sbs",
  "rest", "monster", "quest", "cyou", "work", "support", "help", "online",
  "site", "website", "info", "tk", "ml", "ga", "cf", "gq", "shop", "vip", "lol",
]);

/** Brands most often impersonated, with the domains they actually own. */
export const IMPERSONATED_BRANDS: Record<string, string[]> = {
  paypal: ["paypal.com", "paypal.me"],
  amazon: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.sg", "amazon.in", "amazon.com.au"],
  apple: ["apple.com", "icloud.com"],
  icloud: ["icloud.com", "apple.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com"],
  netflix: ["netflix.com"],
  google: ["google.com", "gmail.com", "youtube.com"],
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  dhl: ["dhl.com"],
  fedex: ["fedex.com"],
  usps: ["usps.com"],
  coinbase: ["coinbase.com"],
  binance: ["binance.com"],
};

export const COMMON_TLDS =
  "com|net|org|co|io|me|ly|gl|gd|at|cc|id|uk|us|sg|my|au|in|de|fr|info|biz|app|dev|bank|xyz|top|click|live|icu|buzz|zip|mov|cfd|sbs|rest|monster|quest|cyou|work|support|help|online|site|website|tk|ml|ga|cf|gq|shop|vip|lol|link|page|services|secure|security|account|login";
