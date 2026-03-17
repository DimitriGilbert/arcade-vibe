"use client";

import { Play } from "lucide-react";
import { ArcadeBadge } from "@/components/arcade";
import { Button } from "@/components/ui/button";
import { StreamingCodeViewerV2 } from "@/components/streaming-code-viewer-v2";
import { useGenerationById } from "@/stores/generations-store";

export interface GameContentProps {
  gameId: string;
  modelKey: string | undefined;
}

export function GameContent({ gameId, modelKey }: GameContentProps) {
  const generation = useGenerationById(modelKey);
  const isStreaming =
    generation?.status === "reasoning" || generation?.status === "generating";
  const showReasoning =
    generation?.status === "reasoning" ||
    (generation?.reasoning !== undefined && generation.reasoning.length > 0 && isStreaming);

  const getBadgeVariant = (): "neon" | "pixel" | "default" => {
    switch (generation?.status) {
      case "complete":
        return "neon";
      case "error":
        return "pixel";
      default:
        return "default";
    }
  };

  return (
    <div
      className="h-full flex flex-col rounded-lg border border-border bg-card overflow-hidden"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {generation?.modelKey ?? "Model"}
          </span>
          <ArcadeBadge text={generation?.status ?? "idle"} variant={getBadgeVariant()} />
        </div>
        <div className="flex items-center gap-2">
          {generation?.gameId ? (
            <Button
              size="sm"
              onClick={() =>
                window.open(`/game/${generation.gameId}`, "_blank")
              }
            >
              <Play className="h-3 w-3 mr-1" /> Play
            </Button>
          ) : null}
        </div>
      </div>

      {showReasoning ? (
        <div className="shrink-0 max-h-48 overflow-auto border-b border-border bg-muted/30">
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Reasoning
          </div>
          <div className="px-4 pb-3 text-sm whitespace-pre-wrap">
            {generation?.reasoning ?? ""}
            {generation?.status === "reasoning" ? (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden">
        <StreamingCodeViewerV2
          code={generation?.code ?? ""}
          language="html"
          isStreaming={isStreaming}
          fileName="game.html"
        />
      </div>
    </div>
  );
}
