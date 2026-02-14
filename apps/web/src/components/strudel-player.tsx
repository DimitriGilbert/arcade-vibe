"use client";

import { useEffect, useRef, useState } from "react";
import { Music, AlertCircle, Loader2 } from "lucide-react";

interface StrudelPlayerProps {
  code: string;
  className?: string;
  height?: number;
}

export function StrudelPlayer({
  code,
  className = "",
  height = 400,
}: StrudelPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const replRef = useRef<HTMLElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingScript = document.querySelector(
      'script[src="https://unpkg.com/@strudel/embed@1.1.2"]'
    );

    if (existingScript) {
      setStatus("ready");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@strudel/embed@1.1.2";
    script.async = true;
    scriptRef.current = script;

    script.onload = () => {
      setStatus("ready");
    };

    script.onerror = () => {
      setStatus("error");
      setErrorMessage("Failed to load Strudel music player. Check your internet connection.");
    };

    document.head.appendChild(script);

    return () => {
      if (scriptRef.current && !existingScript) {
        scriptRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !containerRef.current || replRef.current) return;

    const repl = document.createElement("strudel-repl");
    repl.setAttribute("code", code);
    containerRef.current.appendChild(repl);
    replRef.current = repl;
  }, [status, code]);

  useEffect(() => {
    if (replRef.current && code) {
      replRef.current.setAttribute("code", code);
    }
  }, [code]);

  if (status === "loading") {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--muted)]/10 rounded-lg border border-[var(--border)] ${className}`}
        style={{ minHeight: height }}
      >
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading music player...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--destructive)]/10 rounded-lg border border-[var(--destructive)]/30 ${className}`}
        style={{ minHeight: height }}
      >
        <div className="flex items-center gap-2 text-[var(--destructive)]">
          <AlertCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`strudel-player-wrapper ${className}`}>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Music className="h-4 w-4 text-[var(--primary)]" />
        <span className="text-sm font-medium text-[var(--foreground)]">Music Preview</span>
      </div>
      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--card)]"
        style={{ minHeight: height }}
      />
    </div>
  );
}