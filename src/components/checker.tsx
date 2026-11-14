"use client";

import { useRef, useState } from "react";
import { LinkChecker } from "./link-checker";
import { MessageChecker } from "./message-checker";
import { ChatIcon, SearchIcon } from "./ui";

type Mode = "message" | "identifier";

const TABS: { id: Mode; label: string; short: string; icon: React.ReactNode }[] = [
  { id: "message", label: "Check a message", short: "Message", icon: <ChatIcon /> },
  { id: "identifier", label: "Check a link or number", short: "Link or number", icon: <SearchIcon /> },
];

export function Checker({ aiEnabled }: { aiEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("message");
  // Held here so switching tabs never loses what someone pasted.
  const [message, setMessage] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = TABS[(TABS.findIndex((t) => t.id === mode) + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setMode(next.id);
    requestAnimationFrame(() => tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus());
  };

  return (
    <div>
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="What do you want to check?"
        onKeyDown={onKeyDown}
        className="mb-5 inline-flex rounded-full border border-line bg-surface p-1"
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
            onClick={() => setMode(tab.id)}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] transition-colors ${
              mode === tab.id ? "bg-bg font-medium text-ink shadow-[0_1px_2px_rgba(14,14,16,0.06)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </button>
        ))}
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
