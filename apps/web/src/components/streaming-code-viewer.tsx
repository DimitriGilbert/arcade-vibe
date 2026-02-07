"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Copy, Download, Moon, Sun } from "lucide-react";
import { highlightCode, isShikiInitialized } from "@/lib/shiki";

/**
 * StreamingCodeViewer - A code viewer component with Shiki syntax highlighting
 *
 * @example
 * ```tsx
 * import { StreamingCodeViewer } from "@/components";
 *
 * function CodeBlock() {
 *   const [code, setCode] = useState("");
 *   const [isStreaming, setIsStreaming] = useState(true);
 *
 *   // Simulate streaming
 *   useEffect(() => {
 *     const stream = async () => {
 *       // ... streaming logic
 *       setIsStreaming(false);
 *     };
 *     stream();
 *   }, []);
 *
 *   return (
 *     <StreamingCodeViewer
 *       code={code}
 *       language="typescript"
 *       isStreaming={isStreaming}
 *       fileName="example.ts"
 *       onComplete={() => console.log("Code generation complete")}
 *     />
 *   );
 * }
 * ```
 */
export interface StreamingCodeViewerProps {
  code: string;
  language: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  fileName?: string;
  maxLines?: number;
}

// eslint-disable-next-line react/no-dangerously-set-inner-html -- Shiki generates trusted, safe HTML for syntax highlighting
export function StreamingCodeViewer({
  code,
  language,
  isStreaming = false,
  onComplete,
  fileName,
  maxLines = 1000,
}: StreamingCodeViewerProps) {
  const [theme, setTheme] = useState<"github-dark" | "github-light">("github-dark");
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isShikiReady, setIsShikiReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize Shiki on mount
  useEffect(() => {
    if (!isShikiInitialized()) {
      import("@/lib/shiki").then(({ initShiki }) => {
        initShiki().then(() => {
          setIsShikiReady(true);
        });
      });
    } else {
      setIsShikiReady(true);
    }
  }, []);

  // Highlight code when it changes or theme changes
  useEffect(() => {
    if (!isShikiReady || !code) {
      return;
    }

    const highlight = async () => {
      const html = await highlightCode({
        code,
        lang: language,
        theme,
      });
      setHighlightedCode(html);

      // Update progress based on streaming state
      if (isStreaming) {
        setProgress(50); // Streaming in progress
      } else {
        setProgress(100);
        onComplete?.();
      }
    };

    highlight();
  }, [code, language, theme, isShikiReady, isStreaming, onComplete]);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [code]);

  // Download code as file
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

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "github-dark" ? "github-light" : "github-dark"));
  }, []);

  // Calculate line count for scrolling limit
  const lineCount = code.split("\n").length;
  const displayCode = lineCount > maxLines ? code.split("\n").slice(0, maxLines).join("\n") : code;

  const themeBgColor = theme === "github-dark" ? "bg-[#0d1117]" : "bg-[#ffffff]";
  const themeBorderColor = theme === "github-dark" ? "border-[#30363d]" : "border-[#d0d7de]";
  const themeTextColor = theme === "github-dark" ? "text-[#c9d1d9]" : "text-[#24292f]";

  return (
    <div
      className={`relative rounded-lg border ${themeBorderColor} ${themeBgColor} overflow-hidden font-mono text-sm transition-colors duration-300`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${themeBorderColor} ${theme === "github-dark" ? "bg-[#161b22]" : "bg-[#f6f8fa]"}`}
      >
        <div className="flex items-center gap-2">
          {fileName && (
            <span className={`text-xs font-medium ${themeTextColor} opacity-80`}>
              {fileName}
            </span>
          )}
          <span
            className={`text-xs font-mono ${themeTextColor} opacity-60`}
          >
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress indicator */}
          {isStreaming && progress < 100 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-blue-400">Generating...</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-md ${theme === "github-dark" ? "hover:bg-[#30363d]" : "hover:bg-[#d8dee4]"} transition-colors`}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "github-dark" ? (
              <Sun className="w-4 h-4 text-gray-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`p-1.5 rounded-md ${theme === "github-dark" ? "hover:bg-[#30363d]" : "hover:bg-[#d8dee4]"} transition-colors`}
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Download button */}
          {fileName && (
            <button
              type="button"
              onClick={handleDownload}
              className={`p-1.5 rounded-md ${theme === "github-dark" ? "hover:bg-[#30363d]" : "hover:bg-[#d8dee4]"} transition-colors`}
              aria-label="Download code"
              title="Download code"
            >
              <Download className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div
        className={`overflow-x-auto overflow-y-auto max-h-[600px]`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: theme === "github-dark" ? "#30363d #0d1117" : "#d0d7de #ffffff",
        }}
      >
        <div className="inline-block min-w-full">
          {isShikiReady && highlightedCode ? (
            <div
              className="p-4"
              // Shiki generates trusted, safe HTML for syntax highlighting
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          ) : (
            <div className={`p-4 ${themeTextColor} opacity-60`}>
              {code.split("\n").map((line, index) => (
                <div key={`${index}-${line.slice(0, 10)}`} className="whitespace-pre">
                  {line || "\u00A0"}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Truncated indicator */}
      {lineCount > maxLines && (
        <div
          className={`px-4 py-2 border-t ${themeBorderColor} ${theme === "github-dark" ? "bg-[#161b22]" : "bg-[#f6f8fa]"}`}
        >
          <p className={`text-xs ${themeTextColor} opacity-60`}>
            Displaying {maxLines} of {lineCount} lines
          </p>
        </div>
      )}

      {/* Loading overlay for initial Shiki load */}
      {!isShikiReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading syntax highlighter...</span>
          </div>
        </div>
      )}
    </div>
  );
}
