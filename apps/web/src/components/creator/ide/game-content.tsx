"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Check, Copy, Download, Moon, Sun } from "lucide-react";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { useGenerationById } from "@/stores/generations-store";
import { trpcClient } from "@/utils/trpc";

export interface GameContentProps {
  gameId: string;
  modelKey: string | undefined;
  title?: string;
  modelName?: string;
}

export function GameContent({ gameId, modelKey, title, modelName }: GameContentProps) {
  const [theme, setTheme] = useState<"github-dark" | "github-light">("github-dark");
  const [copied, setCopied] = useState(false);

  const generation = useGenerationById(modelKey);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const showReasoning =
    generation?.status === "reasoning" ||
    (generation?.reasoning !== undefined && generation.reasoning.length > 0 && isStreaming);
  const hasGenerationInStore = !!generation;
  const isComplete = generation?.status === "complete";
  const hasCodeInMemory = !!generation?.code;

  const { data: gameCode, isLoading: isLoadingGame } = useQuery({
    queryKey: ["game-code", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const result = await trpcClient.games.getRawCode.query({ gameId });
      return result?.html ?? null;
    },
    enabled: !hasGenerationInStore || (isComplete && !hasCodeInMemory),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const code = hasCodeInMemory 
    ? generation.code 
    : (gameCode ?? "");
  const displayTitle = title ?? modelName ?? generation?.modelKey ?? modelKey ?? "Game";
  const displayModelName = modelName ?? generation?.modelKey ?? modelKey ?? "Model";
  const showModelName = displayModelName !== displayTitle;
  const hasGameId = generation?.gameId ?? (gameCode ? gameId : null);

  const isLoading = isLoadingGame && !code;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy code");
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "game.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "github-dark" ? "github-light" : "github-dark"));
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/50 shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{displayTitle}</div>
          {showModelName ? (
            <div className="text-xs text-[var(--muted-foreground)] truncate">
              {displayModelName}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {hasGameId ? (
            <button
              type="button"
              onClick={() => window.open(`/game/${hasGameId}`, "_blank")}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90 transition-opacity"
            >
              <Play className="h-3 w-3" /> Play
            </button>
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
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
            aria-label="Download code"
            title="Download code"
          >
            <Download className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      {showReasoning ? (
        <div className="shrink-0 max-h-48 overflow-auto border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Reasoning
          </div>
          <div className="px-4 pb-3 text-sm whitespace-pre-wrap">
            {generation?.reasoning ?? ""}
            {generation?.status === "reasoning" ? (
              <span className="inline-block w-2 h-4 bg-[var(--primary)] animate-pulse ml-1" />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : (
          <StreamingCodeViewerV2
            code={code}
            language="html"
            isStreaming={isStreaming}
            showHeader={false}
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </div>
    </div>
  );
}
