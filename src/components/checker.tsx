"use client";

import { useRef, useState } from "react";
import { LinkChecker } from "./link-checker";
import { MessageChecker } from "./message-checker";
import { ChatIcon, SearchIcon } from "./ui";

type Mode = "message" | "identifier";

const TABS: { id: Mode; label: string; short: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: "message",
    label: "Check a message",
    short: "Message",
    hint: "Paste a text, email, chat message or notes from a call.",
    icon: <ChatIcon />,
  },
  {
    id: "identifier",
    label: "Check a link or number",
    short: "Link or number",
    hint: "Just one link, phone number or email address.",
    icon: <SearchIcon />,
  },
];

export function Checker({ aiEnabled }: { aiEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("message");
  // Held here so switching tabs never loses what someone pasted.
  const [message, setMessage] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const active = TABS.find((t) => t.id === mode)!;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = TABS[(TABS.findIndex((t) => t.id === mode) + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setMode(next.id);
    requestAnimationFrame(() => tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus());
  };

  return (
    <div>
      <div className="mb-5">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="What do you want to check?"
          onKeyDown={onKeyDown}
          className="inline-flex self-start rounded-full border border-line bg-surface-2 p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab={tab.id}
              id={`tab-${tab.id}`}
              aria-selected={mode === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={mode === tab.id ? 0 : -1}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13.5px] transition-colors sm:h-9 ${
                mode === tab.id
                  ? "bg-bg font-medium text-ink shadow-[0_1px_2px_rgba(24,35,28,0.07)] [&_svg]:text-accent"
                  : "text-ink-2 hover:text-ink"
              }`}
              onClick={() => setMode(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.short}</span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 pl-1 text-[12.5px] text-ink-3">{active.hint}</p>
      </div>

      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
        {mode === "message" ? (
          <MessageChecker aiEnabled={aiEnabled} message={message} setMessage={setMessage} />
        ) : (
          <LinkChecker />
        )}
      </div>
    </div>
  );
}
