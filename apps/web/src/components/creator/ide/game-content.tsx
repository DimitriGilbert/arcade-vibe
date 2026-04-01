"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Code2, Download, Eye, EyeOff, Moon, Play, Sun } from "lucide-react";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { useGenerationById } from "@/stores/generations-store";
import { OutputStatusCard, StatusIcon, WaitingState } from "@/components/creator/shared";
import { trpcClient } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import type { EditorTheme, GameStatus, GenerationStatus } from "./types";
import { GuidanceBubble } from "./creator-guidance";
import type { CreatorGuidanceState } from "./creator-guidance";

export interface GameContentProps {
  gameId: string;
  generationId?: string;
  modelKey: string | undefined;
  title?: string;
  modelName?: string;
  gameStatus?: GameStatus;
  isSubmitted?: boolean;
  viewMode: "game" | "code";
  theme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  onViewModeChange: (viewMode: "game" | "code") => void;
  onTogglePublish: (gameId: string, isSubmitted: boolean) => void;
  isPublishing: boolean;
  guidance: CreatorGuidanceState | null;
  onDismissGuidance: () => void;
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
  generationId,
  modelKey,
  title,
  modelName,
  gameStatus,
  isSubmitted,
  viewMode,
  theme,
  onThemeChange,
  onViewModeChange,
  onTogglePublish,
  isPublishing,
  guidance,
  onDismissGuidance,
}: GameContentProps) {
  const generation = useGenerationById(generationId);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const hasGenerationInStore = !!generation;
  const isComplete = generation?.status === "complete";
  const hasCodeInMemory = !!generation?.code;
  const [iframeKey, setIframeKey] = useState(0);
  const hasPersistedGameId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    gameId
  );

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

  const { data: persistedGame } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      return await trpcClient.games.getById.query({ id: gameId });
    },
    enabled: hasPersistedGameId,
  });

  const code = hasCodeInMemory ? generation.code : (gameCode ?? "");
  const displayTitle = title ?? modelName ?? generation?.modelKey ?? modelKey ?? "Game";
  const displayModelName = modelName ?? generation?.modelKey ?? modelKey ?? "Model";
  const showModelName = displayModelName !== displayTitle;
  const resolvedGameId = generation?.gameId ?? (hasPersistedGameId ? gameId : null);
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
  const canPlay = Boolean(resolvedGameId);
  const canRenderGame = !!code && status !== "error";
  const published = persistedGame?.isSubmitted ?? isSubmitted ?? false;

  const iframeDocument = useMemo(() => code, [code]);

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

  const handleReloadGame = useCallback(() => {
    setIframeKey((current) => current + 1);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2 shrink-0">
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

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("game")}
              className={cn(
                "rounded px-2.5 py-1 text-xs transition-colors",
                viewMode === "game"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              Game
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("code")}
              className={cn(
                "rounded px-2.5 py-1 text-xs transition-colors",
                viewMode === "code"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <span className="inline-flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                Code
              </span>
            </button>
          </div>

          {resolvedGameId ? (
            <div className="relative">
              {guidance?.currentStep === "publish" && !published ? (
                <div className="absolute bottom-full right-0 z-10 mb-2 w-52">
                  <GuidanceBubble
                    text="If this output is good enough, publish it."
                    onDismiss={onDismissGuidance}
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onTogglePublish(resolvedGameId, !published)}
                disabled={isPublishing}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:cursor-not-allowed disabled:opacity-60",
                  published
                    ? "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                    : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                )}
              >
                {published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {published ? "Unpublish" : "Publish"}
              </button>
            </div>
          ) : null}

          {canPlay ? (
            <button
              type="button"
              onClick={() => window.open(`/game/${resolvedGameId}`, "_blank")}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-2 py-1 text-xs text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              <Play className="h-3 w-3" />
              Play
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
        ) : status === "reasoning" && !generation?.reasoning ? (
          <WaitingState status="reasoning" modelName={displayModelName} />
        ) : status === "generating" && !code ? (
          <WaitingState status="generating" modelName={displayModelName} />
        ) : status === "error" ? (
          <OutputStatusCard
            type="error"
            error={generation?.error ?? "An unknown error occurred during generation."}
          />
        ) : !code && !generation?.reasoning ? (
          <OutputStatusCard type="empty" />
        ) : viewMode === "game" && code ? (
          canRenderGame ? (
            <div className="h-full bg-black/5">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
                <span>Live preview</span>
                <button
                  type="button"
                  onClick={handleReloadGame}
                  className="rounded border border-[var(--border)] px-2 py-1 transition-colors hover:bg-[var(--muted)]"
                >
                  Reload
                </button>
              </div>
              <iframe
                key={`${gameId}-${iframeKey}`}
                title={`Game preview: ${displayTitle}`}
                srcDoc={iframeDocument}
                className="h-[calc(100%-41px)] w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
                allowFullScreen
              />
            </div>
          ) : (
            <OutputStatusCard type="empty" />
          )
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
