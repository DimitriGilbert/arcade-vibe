"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Copy, Download, Moon, Sun } from "lucide-react";
import { highlightCode, initShiki, isShikiInitialized } from "@/lib/shiki";

const shikiWarmupPromise = initShiki();

export interface StreamingCodeViewerV2Props {
  code: string;
  language: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  fileName?: string;
  maxLines?: number;
  reasoning?: string;
}

function clampLines(source: string, maxLines: number): string {
  if (!Number.isFinite(maxLines)) {
    return source;
  }
  const lines = source.split("\n");
  if (lines.length <= maxLines) {
    return source;
  }
  return lines.slice(0, maxLines).join("\n");
}

export function StreamingCodeViewerV2({
  code,
  language,
  isStreaming = false,
  onComplete,
  fileName,
  maxLines = Number.POSITIVE_INFINITY,
  reasoning,
}: StreamingCodeViewerV2Props) {
  const [theme, setTheme] = useState<"github-dark" | "github-light">("github-dark");
  const [isShikiReady, setIsShikiReady] = useState(false);
  const [highlightedCode, setHighlightedCode] = useState("");
  const [highlightedReasoning, setHighlightedReasoning] = useState("");
  const [copied, setCopied] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const targetCodeRef = useRef("");
  const targetReasoningRef = useRef("");
  const highlightingRef = useRef(false);
  const highlightedCodeSignatureRef = useRef("");
  const highlightedReasoningSignatureRef = useRef("");
  const prevIsStreamingRef = useRef(false);

  onCompleteRef.current = onComplete;

  const targetCode = clampLines(code, maxLines);
  const lineCount = code.split("\n").length;

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!isShikiInitialized()) {
        await shikiWarmupPromise;
      }
      if (mounted) {
        setIsShikiReady(true);
      }
    };

    void setup();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    targetCodeRef.current = targetCode;
  }, [targetCode]);

  useEffect(() => {
    targetReasoningRef.current = reasoning ?? "";
  }, [reasoning]);

  useEffect(() => {
    if (!isShikiReady) {
      return;
    }

    if (highlightingRef.current) {
      return;
    }

    const codeSnapshot = targetCodeRef.current;
    const reasoningSnapshot = targetReasoningRef.current;

    const codeSignature = `${language}|${theme}|${codeSnapshot}`;
    const reasoningSignature = reasoningSnapshot;

    const needsCodeSync = codeSignature !== highlightedCodeSignatureRef.current;
    const needsReasoningUpdate = reasoningSignature !== highlightedReasoningSignatureRef.current;

    if (!needsCodeSync && !needsReasoningUpdate) {
      return;
    }

    let cancelled = false;
    highlightingRef.current = true;

    const run = async () => {
      try {
        if (needsCodeSync) {
          if (codeSnapshot.length === 0) {
            if (!cancelled) {
              setHighlightedCode("");
              highlightedCodeSignatureRef.current = codeSignature;
            }
          } else {
            const html = await highlightCode({
              code: codeSnapshot,
              lang: language,
              theme,
            });

            if (cancelled) {
              return;
            }

            setHighlightedCode(html);
            highlightedCodeSignatureRef.current = codeSignature;
          }
        }

        if (needsReasoningUpdate) {
          setHighlightedReasoning(reasoningSnapshot);
          highlightedReasoningSignatureRef.current = reasoningSignature;
        }
      } catch {
        // Silently fail on highlight errors
      } finally {
        highlightingRef.current = false;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [targetCode, reasoning, isShikiReady, language, theme]);

  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming) {
      if (targetCodeRef.current && highlightedCodeSignatureRef.current !== `${language}|${theme}|${targetCodeRef.current}`) {
        const runFinalHighlight = async () => {
          highlightingRef.current = true;
          try {
            const html = await highlightCode({
              code: targetCodeRef.current,
              lang: language,
              theme,
            });
            setHighlightedCode(html);
            highlightedCodeSignatureRef.current = `${language}|${theme}|${targetCodeRef.current}`;
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
          } catch {
            // Silently fail
          } finally {
            highlightingRef.current = false;
          }
        };
        void runFinalHighlight();
      } else if (highlightedCode) {
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }

      if (targetReasoningRef.current && highlightedReasoningSignatureRef.current !== targetReasoningRef.current) {
        setHighlightedReasoning(targetReasoningRef.current);
        highlightedReasoningSignatureRef.current = targetReasoningRef.current;
      }
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming, language, theme, highlightedCode]);

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
    setTheme((prev) => (prev === "github-dark" ? "github-light" : "github-dark"));
    highlightedCodeSignatureRef.current = "";
    highlightedReasoningSignatureRef.current = "";
  }, []);

  return (
    <div
      data-shiki-theme={theme}
      className="streaming-code-viewer relative h-full min-h-0 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden font-mono text-sm transition-colors duration-300 flex flex-col"
    >
      <div className="streaming-code-viewer__header shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="flex items-center gap-2 min-w-0">
          {fileName ? (
            <span className="text-xs font-medium text-[var(--foreground)]/80 truncate">{fileName}</span>
          ) : null}
          <span className="text-xs font-mono text-[var(--foreground)]/60">{language}</span>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)] transition-all duration-150 w-1/2" />
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">Streaming...</span>
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

      <div
        className="streaming-code-viewer__scroll flex-1 min-h-0 max-h-[1000px] overflow-y-auto overflow-x-auto overscroll-contain"
        style={{ maxHeight: "1000px" }}
      >
        <div className="inline-block min-w-full p-4 md:p-5">
          {highlightedReasoning ? (
            <div className="mb-4 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-blue-400">Reasoning</span>
              </div>
              <p className="text-xs text-blue-300/80 italic whitespace-pre-wrap font-mono leading-relaxed">
                {highlightedReasoning}
              </p>
            </div>
          ) : null}
          {highlightedCode ? (
            <div
              className="[&_pre]:m-0 [&_pre]:rounded-lg [&_.shiki]:!bg-transparent [&_.shiki]:m-0"
              // eslint-disable-next-line react/no-dangerously-set-inner-html -- Shiki generates trusted, safe HTML for syntax highlighting
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          ) : null}
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
