"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { tidyOcrText } from "@/lib/ocr-text";
import { ImageIcon } from "./ui";

/**
 * Reads the text out of a screenshot in the browser.
 *
 * Nobody retypes a scam text message. They screenshot it. Asking people to
 * transcribe the thing that frightened them is the fastest way to lose them.
 *
 * The recognition runs entirely on the device: the image is never uploaded, to
 * us or anyone else. That is also the only honest way to handle a picture of
 * someone's inbox, which may hold anything.
 */

const VERSION = "5.1.1";
const CDN = "https://cdn.jsdelivr.net/npm";
const SCRIPT_URL = `${CDN}/tesseract.js@${VERSION}/dist/tesseract.min.js`;
const WORKER_URL = `${CDN}/tesseract.js@${VERSION}/dist/worker.min.js`;
const CORE_URL = `${CDN}/tesseract.js-core@${VERSION}`;
/** The "fast" model is 2 MB rather than 11 MB and is ample for screen text. */
const LANG_URL = "https://tessdata.projectnaptha.com/4.0.0_fast";

const MAX_BYTES = 10 * 1024 * 1024;

interface LoggerMessage {
  status: string;
  progress: number;
}

interface Tesseract {
  recognize(
    image: File,
    lang: string,
    options: Record<string, unknown>,
  ): Promise<{ data: { text: string } }>;
}

declare global {
  interface Window {
    Tesseract?: Tesseract;
  }
}

let scriptPromise: Promise<Tesseract> | null = null;

function loadEngine(): Promise<Tesseract> {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  scriptPromise ??= new Promise<Tesseract>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error("unavailable")));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("unavailable"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

const STAGE_LABEL: Record<string, string> = {
  "loading tesseract core": "Starting the reader",
  "initializing tesseract": "Starting the reader",
  "loading language traineddata": "Downloading the reader (one time only)",
  "initializing api": "Getting ready",
  "recognizing text": "Reading the screenshot",
};

type State =
  | { status: "idle" }
  | { status: "working"; label: string; percent: number }
  | { status: "error"; message: string };

export function ScreenshotInput({
  onText,
  disabled,
}: {
  onText: (text: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const read = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setState({ status: "error", message: "That isn’t an image. Use a screenshot or photo of the message." });
        return;
      }
      if (file.size > MAX_BYTES) {
        setState({ status: "error", message: "That image is over 10 MB. Try a screenshot rather than a photo." });
        return;
      }

      setState({ status: "working", label: "Starting the reader", percent: 0 });
      try {
        const engine = await loadEngine();
        const { data } = await engine.recognize(file, "eng", {
          workerPath: WORKER_URL,
          corePath: CORE_URL,
          langPath: LANG_URL,
          logger: (m: LoggerMessage) =>
            setState({
              status: "working",
              label: STAGE_LABEL[m.status] ?? "Reading the screenshot",
              percent: Math.round((m.progress ?? 0) * 100),
            }),
        });

        const text = tidyOcrText(data.text);
        if (text.length < 8) {
          setState({
            status: "error",
            message: "We couldn’t find readable text in that image. Try a sharper screenshot, or paste the text instead.",
          });
          return;
        }
        setState({ status: "idle" });
        onText(text);
      } catch {
        setState({
          status: "error",
          message: "The screenshot reader couldn’t load. Paste the message as text instead. The checks are exactly the same.",
        });
      }
    },
    [onText],
  );

  // Pasting a screenshot is how most people will actually do this.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (!file) return;
      event.preventDefault();
      void read(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [read]);

  if (state.status === "working")
    return (
      <div className="rounded-xl border border-line bg-surface px-4 py-3.5" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[13px] font-medium text-ink">{state.label}…</p>
          <span className="tnum font-mono text-[11.5px] text-ink-3">{state.percent}%</span>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${Math.max(4, state.percent)}%` }}
          />
        </div>
        <p className="mt-2 text-[11.5px] text-ink-3">Reading happens on your device. The image is not uploaded.</p>
      </div>
    );

  return (
    <div>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void read(file);
        }}
      />
      {/* The whole zone is the control, so the tap target is the full area. */}
      <button
        type="button"
        disabled={disabled}
        aria-label="Choose a screenshot to read"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void read(file);
        }}
        className={`w-full rounded-xl border border-dashed px-4 py-3.5 text-left transition-colors ${
          dragging ? "border-accent bg-accent-wash" : "border-line-strong bg-surface/50 hover:border-accent/50"
        }`}
      >
        <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <span className="text-accent">
              <ImageIcon />
            </span>
            <span>
              Got a screenshot?{" "}
              <span className="font-medium text-accent-strong underline decoration-accent/40 underline-offset-4">
                Choose an image
              </span>
              <span className="hidden sm:inline">, drop it here, or paste it anywhere on this page.</span>
            </span>
          </span>
          <span className="text-[11.5px] text-ink-3">Read on your device, never uploaded</span>
        </span>
      </button>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-[12.5px] leading-relaxed text-high">
          {state.message}
        </p>
      )}
    </div>
  );
}
