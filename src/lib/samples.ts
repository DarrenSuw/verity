import type { Channel } from "@/lib/analyzer/types";

export interface SampleMessage {
  id: string;
  label: string;
  channel: Channel;
  text: string;
}

export const samples: SampleMessage[] = [
  {
    id: "fraud-team",
    label: "“Fraud team” text",
    channel: "sms",
    text: "VERITY ALERT: We detected unusual activity on your account. Your card will be suspended within 24 hours. To keep it active, verify your details at https://verity-secure-login.top/verify or call our Fraud Team on +1 202 555 0147. Reply with the 6-digit code we just sent to confirm it's you.",
  },
  {
    id: "safe-account",
    label: "“Safe account” call",
    channel: "call",
    text: "Caller said he was from Verity's security department. He said my account has been compromised and that I need to move my savings to a safe account immediately to protect them. He told me not to tell bank staff because they might be involved, and asked me to install AnyDesk so he could help me.",
  },
  {
    id: "parcel",
    label: "Parcel redelivery",
    channel: "sms",
    text: "Dear customer, your parcel could not be delivered due to an unpaid customs fee of $1.99. Please reschedule delivery today at bit.ly/3xRdlv to avoid it being returned.",
  },
  {
    id: "qr-parking",
    label: "QR code notice",
    channel: "email",
    text: "PARKING NOTICE: Payment for your vehicle could not be processed. Scan the QR code below to settle the outstanding charge of $4.50 and avoid a $60 penalty. Failure to act within 24 hours may result in legal action and the debt being passed to a collection agency.",
  },
  {
    id: "new-number",
    label: "“New number” message",
    channel: "chat",
    text: "Hi Mum, I dropped my phone and it's completely dead, so this is my new number — save it. I'm locked out of my banking on this phone and a payment is due. Could you send it for me and I'll transfer you back tomorrow? Please don't tell dad, he'll only worry.",
  },
  {
    id: "genuine-otp",
    label: "Genuine code",
    channel: "sms",
    text: "Your Verity verification code is 482913. It expires in 10 minutes. Never share this code with anyone — Verity staff will never ask for it.",
  },
];
