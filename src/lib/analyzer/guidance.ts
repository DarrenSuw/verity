import { organization } from "@/config/organization";
import type { Channel, GuidanceStep, RiskLevel, Signal } from "./types";

const has = (signals: Signal[], ...categories: Signal["category"][]) =>
  signals.some((s) => categories.includes(s.category));

const hasId = (signals: Signal[], ...ids: string[]) => signals.some((s) => ids.includes(s.id));

/**
 * Builds the "how to check safely" plan. Ordered by what protects the customer
 * most, tailored to the warning signs found and the channel the message came in.
 */
export function buildSteps(signals: Signal[], channel: Channel, risk: RiskLevel): GuidanceStep[] {
  const steps: GuidanceStep[] = [];

  if (channel === "call") {
    steps.push({
      id: "hang-up",
      title: "Hang up, then call back on a number you trust",
      detail: `Use ${organization.supportPhone} or the number on the back of your card. Wait a minute or use a different phone, because scammers can keep the line open.`,
    });
  } else {
    steps.push({
      id: "dont-engage",
      title: "Don’t reply, tap links or call numbers in the message",
      detail:
        "Contact details inside a suspicious message lead straight back to whoever sent it, even when they look official.",
    });
  }

  steps.push({
    id: "check-yourself",
    title: "Check for yourself in the official app or website",
    detail: `Open ${organization.appName} or type ${organization.website} into your browser. If there is a real problem with your account, you will see it there.`,
  });

  if (hasId(signals, "new-number")) {
    steps.push({
      id: "known-number",
      title: "Call the person on the number you already have",
      detail:
        "Use the number saved in your phone, not the one that messaged you. If they don’t answer, ask another family member before sending anything.",
    });
  }

  if (hasId(signals, "quishing")) {
    steps.push({
      id: "no-qr",
      title: "Don’t scan a code you were sent",
      detail:
        "A QR code gives you no way to see where it leads. Reach the same page by typing our address yourself, or use the app.",
    });
  }

  if (hasId(signals, "attachment")) {
    steps.push({
      id: "no-attachment",
      title: "Don’t open the attachment",
      detail:
        "Unexpected files install software or open a fake login page. Statements and invoices from us are always in your account.",
    });
  }

  if (hasId(signals, "sender-domain")) {
    steps.push({
      id: "check-address",
      title: "Read the full address, not the display name",
      detail: `Anyone can put “${organization.name}” as a sender name. Only the part after the @ matters, and ours ends in ${organization.website}.`,
    });
  }

  if (has(signals, "credentials")) {
    steps.push({
      id: "never-share",
      title: "Never share codes, PINs or passwords",
      detail:
        "Not with anyone, including people who say they work for us. We will never ask for them by message, email or phone.",
    });
  }

  if (has(signals, "payment")) {
    steps.push({
      id: "no-payment",
      title: "Don’t send money or buy gift cards",
      detail:
        "We will never ask you to move money to protect it or to pay with gift cards or crypto. Once sent, it is very hard to recover.",
    });
  }

  if (has(signals, "remote-access")) {
    steps.push({
      id: "no-install",
      title: "Don’t install anything they suggest",
      detail: "Remote-access and screen-sharing apps give control of your device to someone else. Close the message instead.",
    });
  }

  if (has(signals, "urgency", "threat")) {
    steps.push({
      id: "slow-down",
      title: "Take your time",
      detail: "Genuine account issues don’t disappear in minutes. Pressure to act now is a warning sign in itself.",
    });
  }

  if (has(signals, "secrecy")) {
    steps.push({
      id: "talk-to-someone",
      title: "Talk to someone you trust",
      detail: "Anyone asking you to keep a conversation secret from your bank or family is not on your side.",
    });
  }

  if (risk !== "low" || signals.length > 0) {
    steps.push({
      id: "report",
      title: "Report it",
      detail: `Forward the message to ${organization.reportEmail}, then delete it. Reporting helps us warn other customers.`,
    });
  }

  if (risk === "low" && signals.length === 0) {
    steps.push({
      id: "still-verify",
      title: "Still unsure? Verify before you act",
      detail:
        "A clean result doesn’t prove a message is genuine. If it asks you to do anything, confirm through the app or our official number first.",
    });
  }

  return steps;
}

export function buildRecoverySteps(): GuidanceStep[] {
  return [
    {
      id: "shared-details",
      title: "If you shared a code, password or card details",
      detail: `Call us now on ${organization.supportPhone}. We can block your card and secure your account. Then change your password in ${organization.appName}.`,
    },
    {
      id: "sent-money",
      title: "If you sent money",
      detail: "Contact us immediately. The sooner we know, the better the chance of stopping the payment. Also report it to the police.",
    },
    {
      id: "installed-app",
      title: "If you installed an app or shared your screen",
      detail: "Disconnect from the internet, uninstall the app, and call us from a different device.",
    },
    {
      id: "clicked-link",
      title: "If you only tapped a link",
      detail: "Close the page without entering anything. If you did type in details, follow the first step above.",
    },
  ];
}
