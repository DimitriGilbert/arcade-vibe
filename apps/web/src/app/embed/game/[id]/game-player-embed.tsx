"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamePlayerEmbedProps {
  gameId: string;
}

export function GamePlayerEmbed({ gameId }: GamePlayerEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const gameUrl = `/api/games/${gameId}/play`;

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      iframeRef.current.src = gameUrl;
    }
  }, [gameUrl]);

  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading game...</p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-8">
          <AlertTriangle className="size-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Game</h3>
          <p className="text-muted-foreground text-sm text-center mb-6 max-w-md">
            An error occurred while loading the game. Please try again.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "px-4 py-2 rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors"
            )}
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={gameUrl}
        title={`Game: ${gameId}`}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allowFullScreen
      />
    </div>
  );
}
