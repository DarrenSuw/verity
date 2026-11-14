/**
 * Scams follow scripts. Recognising which script a message belongs to tells the
 * customer something the individual warning signs can't: what the sender will
 * try next. People who know the next move stop falling for the current one.
 */
import type { Playbook, Signal } from "./types";

interface PlaybookRule extends Playbook {
  /** Tokens that must all be present: a signal id, or "category:<name>". */
  requires: string[];
  /** At least one of these must be present, when given. */
  anyOf?: string[];
  /** Higher wins when several playbooks match. More specific means higher. */
  weight: number;
}

const PLAYBOOKS: PlaybookRule[] = [
  {
    id: "safe-account",
    name: "The “safe account” transfer",
    alsoKnownAs: "Bank impersonation, courier fraud",
    description:
      "Someone claiming to be your bank, the police or a fraud team says your money is at risk and must be moved to a “safe” or “holding” account. The account belongs to them.",
    nextMoves: [
      "They will stay on the line while you make the transfer, so you never get a chance to check with anyone.",
      "They may coach you on what to tell your bank if it asks — that the payment is for furniture, a car or family.",
      "Once the first transfer clears they come back for the rest, often the same day.",
    ],
    requires: ["safe-account"],
    weight: 100,
  },
  {
    id: "remote-access",
    name: "The remote-access takeover",
    alsoKnownAs: "Tech support scam, refund scam",
    description:
      "A caller offers to fix a problem if you install a “support tool” or share your screen. That tool hands them control of your device, including your banking app.",
    nextMoves: [
      "Once connected they can blank your screen so you can't see what they're doing.",
      "They may show you a fake refund that looks too large, then ask you to send back the difference.",
      "They will ask you to read out a code — that code approves their payment, not a refund.",
    ],
    requires: ["category:remote-access"],
    anyOf: ["impersonation", "account-alert", "threat", "credential-request"],
    weight: 92,
  },
  {
    id: "code-harvesting",
    name: "The one-time code grab",
    alsoKnownAs: "OTP phishing, SIM-swap setup",
    description:
      "The sender already has enough of your details to start a payment or a login. The only thing missing is the code your bank sends you.",
    nextMoves: [
      "The code you receive will be for their payment or their new device — not for “confirming your identity”.",
      "They will say the code cancels a transaction. Reading it out approves it.",
      "If one code fails they will ask for another, and keep asking.",
    ],
    requires: ["credential-request"],
    weight: 88,
  },
  {
    id: "qr-code",
    name: "The QR code redirect",
    alsoKnownAs: "Quishing",
    description:
      "A QR code hides its destination completely — you can't read it before you scan it. Codes are printed over real ones on parking meters and posted in letters and emails.",
    nextMoves: [
      "Scanning opens a convincing copy of a real payment or login page.",
      "Because you scanned it on your phone, the address bar is short and the fake domain is easy to miss.",
      "Anything you enter, including a one-time code, arrives with them instantly.",
    ],
    requires: ["quishing"],
    weight: 82,
  },
  {
    id: "known-contact",
    name: "The “new number” impersonation",
    alsoKnownAs: "Hi Mum, friend-in-need scam",
    description:
      "A message from a number you don't recognise claims to be a family member or friend who has lost their phone, then asks for money or help.",
    nextMoves: [
      "They will avoid a voice call — the new phone is broken, they're in a meeting, the signal is bad.",
      "The first request is urgent and small, and grows once you've paid.",
      "Call the person back on the number you already have, even if the message tells you not to.",
    ],
    requires: ["new-number"],
    weight: 80,
  },
  {
    id: "credential-phishing",
    name: "The look-alike login page",
    alsoKnownAs: "Credential phishing",
    description:
      "The link opens a copy of a real login page, often pixel-perfect. Everything you type there goes straight to the sender.",
    nextMoves: [
      "The fake page may already show your correct name or the last digits of your card.",
      "After you “log in” it shows an error or a loading spinner, while they use your details straight away.",
      "It will then ask for the one-time code your real bank has just sent you.",
    ],
    requires: ["category:link"],
    anyOf: ["account-alert", "threat", "urgency", "credential-request", "impersonation"],
    weight: 76,
  },
  {
    id: "delivery-fee",
    name: "The missed-delivery fee",
    alsoKnownAs: "Parcel scam, smishing",
    description:
      "A fake delivery notice asks for a small fee to release a parcel. The payment page exists to capture your card details, not to take the fee.",
    nextMoves: [
      "The amount is deliberately tiny — small enough that you don't stop to think.",
      "Days later someone calls about “suspicious activity” on the card you just used.",
      "That second call is the real attack, and it already knows your card details.",
    ],
    requires: ["delivery"],
    anyOf: ["fee-request", "category:link", "category:payment"],
    weight: 74,
  },
  {
    id: "advance-fee",
    name: "The fee before the payout",
    alsoKnownAs: "Advance-fee fraud, prize scam",
    description:
      "Money is waiting for you — a refund, a prize, compensation — but a fee, tax or verification payment is needed first. The payout never arrives.",
    nextMoves: [
      "Each payment unlocks a new and larger fee.",
      "They may send official-looking paperwork or a screenshot of a pending transfer.",
      "It continues until you stop paying, not until the money arrives.",
    ],
    requires: ["prize"],
    anyOf: ["fee-request", "category:payment", "category:link", "category:contact", "credential-request"],
    weight: 70,
  },
  {
    id: "irreversible-payment",
    name: "The unrecoverable payment",
    alsoKnownAs: "Gift card and crypto fraud",
    description:
      "You're steered towards a payment method that can't be reversed, traced or refunded: gift cards, cryptocurrency or a money-transfer service.",
    nextMoves: [
      "They will ask you to buy the cards in person and read out the numbers on the back.",
      "They may send you to a crypto machine and stay on the phone throughout.",
      "The moment the codes or coins leave, the money is gone for good.",
    ],
    requires: [],
    anyOf: ["unusual-payment", "crypto-wallet"],
    weight: 66,
  },
  {
    id: "account-scare",
    name: "The account scare",
    alsoKnownAs: "Suspension phishing",
    description:
      "An alarming notice about your account — suspended, locked, unusual activity — pushes you to act before you check. The alarm is the whole point.",
    nextMoves: [
      "Whatever you do next, it will ask you to confirm details you should never send.",
      "The deadline will keep moving if you hesitate, which a real deadline wouldn't.",
      "The genuine version of this alert, if any, is already waiting in your banking app.",
    ],
    requires: ["threat"],
    anyOf: ["account-alert", "urgency", "category:link", "credential-request"],
    weight: 60,
  },
];

const token = (signals: Signal[], t: string) =>
  t.startsWith("category:")
    ? signals.some((s) => s.category === t.slice(9))
    : signals.some((s) => s.id === t);

/** Returns the most specific playbook the signals fit, or null. */
export function matchPlaybook(signals: Signal[]): Playbook | null {
  const matches = PLAYBOOKS.filter(
    (p) => p.requires.every((t) => token(signals, t)) && (!p.anyOf || p.anyOf.some((t) => token(signals, t))),
  );
  if (!matches.length) return null;
  const best = matches.reduce((a, b) => (b.weight > a.weight ? b : a));
  return {
    id: best.id,
    name: best.name,
    alsoKnownAs: best.alsoKnownAs,
    description: best.description,
    nextMoves: best.nextMoves,
  };
}
