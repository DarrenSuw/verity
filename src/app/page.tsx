import { Checker } from "@/components/checker";
import { ArrowIcon, CheckIcon, Eyebrow, ShieldIcon } from "@/components/ui";
import { organization } from "@/config/organization";
import { aiEnabled } from "@/lib/ai/review";
import { CHECK_GROUPS, TOTAL_CHECKS } from "@/lib/analyzer/checks";

export const dynamic = "force-dynamic";

const NEVER = [
  { title: "Share a one-time code, PIN or password", body: "Not by text, email, chat or phone. Not even to confirm it is you." },
  { title: "Move money to a “safe” account", body: "Your money is already protected where it is. This is always a scam." },
  { title: "Pay with gift cards or crypto", body: "We don’t accept them, and we never charge a fee to release a refund." },
  { title: "Install an app or share your screen", body: "Remote-access tools hand control of your device to a stranger." },
  { title: "Scan a QR code we sent you", body: "A code hides where it goes. Reach your account through the app instead." },
  { title: "Keep a call secret from us or your family", body: "Secrecy protects the scammer, not you." },
];

const PRIVACY = [
  { title: "Screenshots stay on your device", body: "Text is read from the image in your browser. The picture is never uploaded." },
  { title: "Card numbers are removed first", body: "If you paste one by accident, it is stripped out before the check is sent." },
  { title: "Nothing is stored", body: "No account, no history, no message kept after the answer comes back." },
];

export default function Home() {
  return (
    <>
      <header className="site-header sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <a href="#" className="-my-4 flex items-center gap-2.5 py-4" aria-label={`${organization.name} Message Check`}>
            <ShieldIcon className="size-[18px] text-accent" />
            <span className="font-display text-[19px] leading-none text-ink">{organization.name}</span>
            <span className="hidden h-3.5 w-px bg-line-strong sm:block" />
            <span className="hidden text-[13px] text-ink-3 sm:inline">Message Check</span>
          </a>
          <nav className="flex items-center gap-7 text-[13.5px] text-ink-2">
            <a href="#never" className="hidden transition-colors hover:text-ink lg:inline">
              What we never ask
            </a>
            <a href="#how" className="hidden transition-colors hover:text-ink lg:inline">
              How it works
            </a>
            <a
              href={`tel:${organization.supportPhone.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-11 items-center rounded-full border border-accent/30 px-4 text-[13.5px] font-medium text-accent-strong transition-colors hover:border-accent hover:bg-accent-wash sm:h-9"
            >
              Call us
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero-shell relative overflow-hidden">
          <div className="hero-grid" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-20 lg:grid-cols-[1.2fr_1fr]">
            <div className="hero-copy">
              <Eyebrow>A little pause. A lot of protection.</Eyebrow>
              <h1 className="font-display-lg mt-7 max-w-[13ch] text-[48px] text-ink sm:text-[72px]">
                Before you trust it.<br /><span className="hero-accent">Check it.</span>
              </h1>
              <p className="mt-6 max-w-[43ch] text-[16px] leading-[1.75] text-ink-2 sm:text-[18px]">
                Not sure it&apos;s really us? Turn a suspicious message into clear answers, so you can make your next move with confidence.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <a href="#checker" className="primary-link inline-flex h-12 items-center gap-3 rounded-full bg-ink px-6 text-[14px] font-medium text-white">Check a message <ArrowIcon /></a>
                <span className="flex items-center gap-2 text-[12px] text-ink-2"><ShieldIcon /> Private by design. No account needed.</span>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
              <div className="visual-label"><span className="status-dot" /> Clarity before you click</div>
              <div className="preview-message">
                <div className="flex items-center gap-3"><span className="preview-avatar"><ShieldIcon /></span><div><p className="text-[13px] font-semibold">An unexpected message</p><p className="mt-0.5 text-[11px] text-ink-3">Someone claiming to be your bank</p></div><span className="ml-auto text-[10px] text-ink-3">Now</span></div>
                <p className="mt-5 text-[14px] leading-[1.85] text-ink-2">Your account needs attention. <span className="preview-highlight">Share your one-time code</span> to confirm your identity.</p>
                <div className="preview-warning"><span className="warning-symbol">!</span><div><p className="text-[12px] font-semibold">A warning sign worth catching</p><p className="mt-1 text-[11px] leading-relaxed">We&apos;ll never ask you to share a one-time code.</p></div></div>
              </div>
              <div className="preview-check"><span className="preview-check-icon"><CheckIcon /></span><div><p className="text-[12px] font-semibold">Understand the signs.</p><p className="mt-1 text-[11px] text-ink-3">Know what to do next.</p></div><ArrowIcon /></div>
              <span className="visual-caption">ILLUSTRATIVE EXAMPLE / NOT A LIVE RESULT</span>
            </div>
          </div>
        </section>

        <section id="checker" className="checker-band scroll-mt-[88px] border-y border-line py-10 sm:py-14">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">YOUR NEXT STEP, MADE CLEAR</p><h2 className="mt-2 font-display text-[28px] sm:text-[34px]">Let&apos;s take a closer look.</h2></div><p className="flex items-center gap-2 text-[12px] text-ink-3"><ShieldIcon /> No sign-up. No message history.</p></div>
            <Checker aiEnabled={aiEnabled()} />
          </div>
        </section>

        {/* Capability strip: one horizontal row of what the engine covers. */}
        <section id="how" className="coverage-section scroll-mt-[68px] border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-x-10 gap-y-8 py-14 lg:grid-cols-12 sm:py-20">
              <div className="lg:col-span-4">
                <h2 className="font-display text-[28px] leading-[1.12] text-balance text-ink sm:text-[34px]">
                  What we look for
                </h2>
                <p className="mt-4 max-w-[40ch] text-[14.5px] leading-relaxed text-ink-2">
                  <span className="tnum font-medium text-ink">{TOTAL_CHECKS} fixed checks</span> in{" "}
                  {CHECK_GROUPS.length} groups. The same message always gets the same answer, and every result shows which
                  checks matched.
                </p>
              </div>
              <div className="lg:col-span-8">
                <p className="max-w-[62ch] text-[15px] leading-[1.7] text-ink-2">
                  Scams change their wording, but they rely on the same few tactics. Message Check reads your message for
                  those tactics, shows you exactly where they appear, and checks every link and address against the domains
                  we actually own. It also undoes the tricks used to beat filters: spaced-out words, digits standing in for
                  letters, look-alike letters from other alphabets.
                </p>
                <ul className="mt-9 grid gap-x-10 border-t border-line sm:grid-cols-2">
                  {CHECK_GROUPS.map((group) => (
                    <li
                      key={group.id}
                      className="flex items-baseline justify-between gap-4 border-b border-line py-3.5 text-[14px] text-ink"
                    >
                      {group.label}
                      <span className="tnum shrink-0 font-mono text-[11.5px] text-ink-3">{group.signalIds.length}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-3">
                  Our written checks cover English. When a message is in another language we say so rather than report a
                  clean result, because “no warning signs” would read as approval. A clean result is never proof a message
                  is genuine. It means these particular tactics were not found.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Promise: sticky heading, divided rows. */}
        <section id="never" className="promise-section scroll-mt-[68px] border-b border-line bg-surface">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-x-10 gap-y-8 py-14 lg:grid-cols-12 sm:py-20">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-[100px]">
                  <Eyebrow>Our promise</Eyebrow>
                  <h2 className="mt-5 font-display text-[28px] leading-[1.12] text-balance text-ink sm:text-[32px]">
                    We will never ask you to…
                  </h2>
                  <p className="mt-4 max-w-[36ch] text-[14.5px] leading-relaxed text-ink-2">
                    If a message or caller asks for any of these, it isn’t {organization.name}, no matter how convincing it
                    looks or who it says it is from.
                  </p>
                </div>
              </div>
              <ul className="border-t border-line lg:col-span-8">
                {NEVER.map((item) => (
                  <li key={item.title} className="grid grid-cols-[14px_1fr] gap-x-4 border-b border-line py-5">
                    <span className="mt-[0.55em] size-[7px] rounded-[2px] bg-accent-bright" aria-hidden />
                    <div>
                      <p className="text-[15.5px] font-medium text-ink">{item.title}</p>
                      <p className="mt-1 max-w-[58ch] text-[14px] leading-relaxed text-ink-2">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Privacy: three columns. */}
        <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="font-display max-w-[20ch] text-[28px] leading-[1.12] text-balance text-ink sm:text-[34px]">
            Built so you never have to trust us with much
          </h2>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {PRIVACY.map((item) => (
              <div key={item.title} className="privacy-card rounded-2xl border border-line bg-bg p-6">
                <dt className="text-[15px] font-medium text-ink">{item.title}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-ink-2">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="site-footer border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-8 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} {organization.name}. Message Check offers guidance, not a guarantee.
          </p>
          <p>
            Worried right now? Call <span className="tnum font-mono text-ink-2">{organization.supportPhone}</span>
          </p>
        </div>
      </footer>
    </>
  );
}
