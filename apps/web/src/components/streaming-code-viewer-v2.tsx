"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Copy, Download, Moon, Sun } from "lucide-react";
import { highlightCode, initShiki, isShikiInitialized } from "@/lib/shiki";

const shikiWarmupPromise = initShiki();
const RENDER_INTERVAL_MS = 33;
const STREAM_HIGHLIGHT_INTERVAL_MS = 220;
const IDLE_HIGHLIGHT_INTERVAL_MS = 50;

export interface StreamingCodeViewerV2Props {
  code: string;
  language: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  fileName?: string;
  maxLines?: number;
}

function truncateByMaxLines(source: string, maxLines: number): string {
  const lines = source.split("\n");
  if (lines.length <= maxLines) {
    return source;
  }
  return lines.slice(0, maxLines).join("\n");
}

// eslint-disable-next-line react/no-dangerously-set-inner-html -- Shiki generates trusted, safe HTML for syntax highlighting
export function StreamingCodeViewerV2({
  code,
  language,
  isStreaming = false,
  onComplete,
  fileName,
  maxLines = 1000,
}: StreamingCodeViewerV2Props) {
  const [theme, setTheme] = useState<"github-dark" | "github-light">(
    "github-dark",
  );
  const [isShikiReady, setIsShikiReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedCode, setRenderedCode] = useState("");
  const [highlightedCode, setHighlightedCode] = useState("");
  const [highlightedFor, setHighlightedFor] = useState("");

  const onCompleteRef = useRef(onComplete);
  const latestCodeRef = useRef(code);
  const isHighlightingRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      if (!isShikiInitialized()) {
        await shikiWarmupPromise;
      }
      if (isMounted) {
        setIsShikiReady(true);
      }
    };

    void setup();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const applyNextFrame = () => {
      const next = truncateByMaxLines(latestCodeRef.current, maxLines);
      setRenderedCode((prev) => (prev === next ? prev : next));
    };

    applyNextFrame();
    const intervalId = setInterval(applyNextFrame, RENDER_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [maxLines]);

  useEffect(() => {
    if (!isShikiReady || !renderedCode) {
      setHighlightedCode("");
      setHighlightedFor("");
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled || isHighlightingRef.current) {
        return;
      }

      const source = renderedCode;
      if (!source || source === highlightedFor) {
        return;
      }

      isHighlightingRef.current = true;
      try {
        const html = await highlightCode({
          code: source,
          lang: language,
          theme,
        });

        if (cancelled) {
          return;
        }

        setHighlightedCode(html);
        setHighlightedFor(source);
      } catch {
        if (!cancelled) {
          setHighlightedCode("");
          setHighlightedFor("");
        }
      } finally {
        isHighlightingRef.current = false;
      }
    };

    void tick();
    const intervalId = setInterval(
      () => {
        void tick();
      },
      isStreaming ? STREAM_HIGHLIGHT_INTERVAL_MS : IDLE_HIGHLIGHT_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [renderedCode, highlightedFor, isShikiReady, language, theme, isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      setProgress(50);
      return;
    }

    setProgress(100);
    if (renderedCode.length > 0) {
      onCompleteRef.current?.();
    }
  }, [isStreaming, renderedCode]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    if (!fileName) return;

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code, fileName]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) =>
      prev === "github-dark" ? "github-light" : "github-dark",
    );
  }, []);

  const progressClass =
    progress >= 100 ? "w-full" : progress === 0 ? "w-0" : "w-1/2";

  const lineCount = code.split("\n").length;

  return (
    <div
      data-shiki-theme={theme}
      className="streaming-code-viewer relative h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden font-mono text-sm transition-colors duration-300 flex flex-col"
    >
      <div className="streaming-code-viewer__header shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="flex items-center gap-2 min-w-0">
          {fileName ? (
            <span className="text-xs font-medium text-[var(--foreground)]/80 truncate">
              {fileName}
            </span>
          ) : null}
          <span className="text-xs font-mono text-[var(--foreground)]/60">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && progress < 100 ? (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-[var(--primary)] transition-all duration-300 ${progressClass}`}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                Streaming...
              </span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "github-dark" ? (
              <Sun className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>

          {fileName ? (
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
              aria-label="Download code"
              title="Download code"
            >
              <Download className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="streaming-code-viewer__scroll flex-1 min-h-0 overflow-y-auto overflow-x-auto overscroll-contain">
        <div className="inline-block min-w-full p-4 md:p-5">
          {highlightedCode && highlightedFor === renderedCode ? (
            <div
              className="[&_pre]:m-0 [&_pre]:rounded-lg [&_.shiki]:!bg-transparent [&_.shiki]:m-0"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          ) : (
            <div className="text-[var(--foreground)]/80">
              {renderedCode.split("\n").map((line, index) => (
                <div
                  key={`${index}-${line.slice(0, 16)}`}
                  className="whitespace-pre"
                >
                  {line || "\u00A0"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lineCount > maxLines ? (
        <div className="shrink-0 px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]">
          <p className="text-xs text-[var(--foreground)]/60">
            Displaying {maxLines} of {lineCount} lines
          </p>
        </div>
      ) : null}
    </div>
  );
}
