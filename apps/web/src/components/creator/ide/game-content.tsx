"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Download, Moon, Sun } from "lucide-react";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { useGenerationById } from "@/stores/generations-store";
import { OutputStatusCard, StatusIcon, WaitingState } from "@/components/creator/shared";
import { trpcClient } from "@/utils/trpc";
import type { EditorTheme, GameStatus, GenerationStatus } from "./types";

export interface GameContentProps {
  gameId: string;
  modelKey: string | undefined;
  title?: string;
  modelName?: string;
  gameStatus?: GameStatus;
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
}

function mapGameStatusToGenerationStatus(status: GameStatus | undefined): GenerationStatus {
  switch (status) {
    case "completed":
      return "complete";
    case "failed":
      return "error";
    case "generating":
      return "generating";
    default:
      return "idle";
  }
}

export function GameContent({
  gameId,
  modelKey,
  title,
  modelName,
  gameStatus,
  theme,
  onThemeChange,
}: GameContentProps) {
  const generation = useGenerationById(modelKey);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
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

  const code = hasCodeInMemory ? generation.code : (gameCode ?? "");
  const displayTitle = title ?? modelName ?? generation?.modelKey ?? modelKey ?? "Game";
  const displayModelName = modelName ?? generation?.modelKey ?? modelKey ?? "Model";
  const showModelName = displayModelName !== displayTitle;
  const hasGameId = generation?.gameId ?? (gameCode ? gameId : null);
  const status = generation?.status ?? mapGameStatusToGenerationStatus(gameStatus);
  const statusLabel =
    status === "reasoning"
      ? "Reasoning"
      : status === "generating"
        ? "Generating"
        : status === "complete"
          ? "Complete"
          : status === "error"
            ? "Failed"
            : "Ready";

  const isLoading = isLoadingGame && !code;

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
    onThemeChange(theme === "github-dark" ? "github-light" : "github-dark");
  }, [onThemeChange, theme]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/50 shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          <StatusIcon status={status} className="h-3.5 w-3.5" />
          <div className="text-sm font-medium truncate">{displayTitle}</div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
            {statusLabel}
          </span>
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
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors"
            aria-label="Download code"
            title="Download code"
          >
            <Download className="w-4 h-4 text-[var(--muted-foreground)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : !code && status === "reasoning" ? (
          <WaitingState status="reasoning" modelName={displayModelName} />
        ) : !code && status === "generating" ? (
          <WaitingState status="generating" modelName={displayModelName} />
        ) : status === "error" ? (
          <OutputStatusCard
            type="error"
            error={generation?.error ?? "An unknown error occurred during generation."}
          />
        ) : !code ? (
          <OutputStatusCard type="empty" />
        ) : (
          <StreamingCodeViewerV2
            code={code}
            language="html"
            isStreaming={isStreaming}
            showHeader={false}
            theme={theme}
            onThemeChange={onThemeChange}
            reasoning={generation?.reasoning}
            showReasoningLabel={false}
          />
        )}
      </div>
    </div>
  );
}
