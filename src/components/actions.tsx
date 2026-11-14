"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon, PrintIcon, SoundIcon, StopIcon } from "./ui";

/**
 * Listen, copy, print.
 *
 * The people most often targeted are the least likely to be reading a screen
 * comfortably, so the advice can be spoken. The report can be copied for the
 * relative they will ask about it, or printed as a record for the bank.
 */
export function ResultActions({ reportText, spokenText }: { reportText: string; spokenText: string }) {
  const [canSpeak, setCanSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      window.speechSynthesis?.cancel();
      clearTimeout(timer.current);
    };
  }, []);

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setCopyFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap gap-2">
        {canSpeak && (
          <Action onClick={speak} active={speaking}>
            {speaking ? <StopIcon /> : <SoundIcon />}
            {speaking ? "Stop" : "Listen"}
          </Action>
        )}
        <Action onClick={() => void copy()} active={copied}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy report"}
        </Action>
        <Action onClick={() => window.print()}>
          <PrintIcon />
          Save as PDF
        </Action>
      </div>
      {copyFailed && (
        <p role="alert" className="mt-2 text-[12px] text-ink-3">
          Your browser blocked the clipboard. Use “Save as PDF” instead.
        </p>
      )}
    </div>
  );
}

function Action({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
