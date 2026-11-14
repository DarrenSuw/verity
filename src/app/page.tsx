import { Checker } from "@/components/checker";
import { ShieldIcon } from "@/components/ui";
import { organization } from "@/config/organization";
import { aiEnabled } from "@/lib/ai/review";

export const dynamic = "force-dynamic";

const NEVER = [
  { title: "Share a one-time code, PIN or password", body: "Not by text, email, chat or phone. Not even to confirm it’s you." },
  { title: "Move money to a “safe” account", body: "Your money is already protected where it is. This is always a scam." },
  { title: "Pay with gift cards or crypto", body: "We don’t accept them, and we never charge fees to release a refund." },
  { title: "Install an app or share your screen", body: "Remote-access tools hand control of your device to a stranger." },
  { title: "Keep a call secret from us or your family", body: "Secrecy protects the scammer, not you." },
];

const CHECKS = [
  "Requests for codes, PINs and passwords",
  "Pressure, deadlines and threats",
  "Look-alike and disguised links",
  "Requests to move money or pay fees",
  "Remote-access and app installs",
  "Moves to WhatsApp or private numbers",
  "Prizes and refunds you didn’t expect",
  "Calls to keep it secret",
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between px-4 sm:px-8">
          <a href="#" className="flex items-baseline gap-2.5" aria-label={`${organization.name} Message Check`}>
            <span className="font-display text-[21px] leading-none text-ink">{organization.name}</span>
            <span className="hidden h-3.5 w-px translate-y-0.5 bg-line-strong sm:block" />
            <span className="hidden text-[13px] text-ink-3 sm:inline">Message Check</span>
          </a>
          <nav className="flex items-center gap-6 text-[13px] text-ink-2">
            <a href="#never" className="hidden transition-colors hover:text-ink sm:inline">
              What we never ask
            </a>
            <a href="#how" className="hidden transition-colors hover:text-ink sm:inline">
              How it works
            </a>
            <a
              href={`tel:${organization.supportPhone.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-8 items-center rounded-full border border-line px-3.5 text-ink transition-colors hover:border-line-strong"
            >
              Call us
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1160px] px-4 sm:px-8">
        <section className="pt-14 pb-10 sm:pt-24 sm:pb-14">
          <p className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.14em] text-ink-3 uppercase">
            <ShieldIcon className="text-accent" />
            Message Check
          </p>
          <h1 className="mt-5 max-w-[16ch] font-display text-[42px] leading-[1.05] text-ink sm:text-[64px]">
            Not sure it’s <span className="text-accent">really</span> us?
          </h1>
          <p className="mt-6 max-w-[54ch] text-[16.5px] leading-relaxed text-ink-2 sm:text-[17.5px]">
            Paste a text, email or chat message, or notes from a call. We’ll point out the warning signs and show
            you how to check safely, before you click, call or pay.
          </p>
        </section>

        <Checker aiEnabled={aiEnabled()} />

        <section id="never" className="scroll-mt-24 border-t border-line pt-16 mt-24 sm:pt-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-[12px] font-medium tracking-[0.14em] text-ink-3 uppercase">Our promise</p>
              <h2 className="mt-4 font-display text-[30px] leading-[1.12] sm:text-[38px]">
                We will never ask you to…
              </h2>
              <p className="mt-4 max-w-[38ch] text-[14.5px] leading-relaxed text-ink-2">
                If a message or caller asks for any of these, it isn’t {organization.name}, no matter how convincing
                it looks or who it says it’s from.
              </p>
            </div>
            <ol className="divide-y divide-line border-y border-line lg:col-span-8">
              {NEVER.map((item, i) => (
                <li key={item.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-5">
                  <span className="font-display text-[15px] leading-7 text-ink-3">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[16px] font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-[12px] font-medium tracking-[0.14em] text-ink-3 uppercase">How it works</p>
              <h2 className="mt-4 font-display text-[30px] leading-[1.12] sm:text-[38px]">
                What we look for
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="max-w-[60ch] text-[15px] leading-relaxed text-ink-2">
                Scams change their wording, but they rely on the same few tactics. Message Check reads your message
                for those tactics, shows you exactly where they appear, and checks every link against the domains
                we actually own. It gives guidance, not a guarantee: when in doubt, contact us directly.
              </p>
              <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                {CHECKS.map((c) => (
                  <li key={c} className="bg-bg px-5 py-4 text-[14px] text-ink">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[12.5px] leading-relaxed text-ink-3">
                Privacy: messages are checked on our servers and are never stored or used for marketing.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-3 px-4 py-8 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {organization.name}. Message Check offers guidance, not a guarantee.
          </p>
          <p>
            Worried right now? Call <span className="font-mono text-ink-2">{organization.supportPhone}</span>
          </p>
        </div>
      </footer>
    </>
  );
}
