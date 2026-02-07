"use client";

import React, { useState, useRef, useEffect, useCallback, type ComponentProps } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface GamePlayerProps {
  /**
   * URL of the game to load in the iframe
   */
  gameUrl: string;

  /**
   * Session token for authentication/injection
   * Can be passed via URL param or postMessage
   */
  sessionToken?: string;

  /**
   * How to inject the session token
   * @default "url"
   */
  tokenInjectionMethod?: "url" | "postMessage";

  /**
   * URL parameter name for token injection
   * @default "sessionToken"
   */
  tokenParamName?: string;

  /**
   * Game ID for tracking and error reporting
   */
  gameId: string;

  /**
   * Optional className for styling
   */
  className?: string;

  /**
   * Height of the iframe container
   * @default "h-full"
   */
  height?: string;

  /**
   * Width of the iframe container
   * @default "w-full"
   */
  width?: string;

  /**
   * Custom loading message
   * @default "Loading game..."
   */
  loadingMessage?: string;

  /**
   * Callback when game successfully loads
   */
  onLoad?: () => void;

  /**
   * Callback when game fails to load
   */
  onError?: (error: Error) => void;
}

interface GameErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class GameErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    gameId: string;
    onError?: (error: Error) => void;
  }>,
  GameErrorState
> {
  constructor(props: React.PropsWithChildren<{
    gameId: string;
    onError?: (error: Error) => void;
  }>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GameErrorState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <AlertTriangle className="size-12 text-destructive" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Game Failed to Load</h3>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            {this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Error Details
                </summary>
                <pre className="mt-2 p-4 text-xs bg-muted rounded-md overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GamePlayer({
  gameUrl,
  sessionToken,
  tokenInjectionMethod = "url",
  tokenParamName = "sessionToken",
  gameId,
  className,
  height = "h-full",
  width = "w-full",
  loadingMessage = "Loading game...",
  onLoad,
  onError,
}: GamePlayerProps): React.ReactNode {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeError, setIframeError] = useState<Error | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct final URL with token if using URL injection
  const getFinalUrl = useCallback(() => {
    if (tokenInjectionMethod === "url" && sessionToken) {
      const url = new URL(gameUrl);
      url.searchParams.set(tokenParamName, sessionToken);
      return url.toString();
    }
    return gameUrl;
  }, [gameUrl, sessionToken, tokenInjectionMethod, tokenParamName]);

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setIframeError(null);
    onLoad?.();

    // Inject session token via postMessage if configured
    if (tokenInjectionMethod === "postMessage" && sessionToken && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          {
            type: "SESSION_TOKEN",
            token: sessionToken,
            gameId,
          },
          new URL(gameUrl).origin
        );
      } catch (error) {
        console.error("Failed to inject session token via postMessage:", error);
      }
    }
  }, [gameUrl, gameId, sessionToken, tokenInjectionMethod, onLoad]);

  // Handle iframe error event
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    const error = new Error(`Failed to load game from ${gameUrl}`);
    setIframeError(error);
    onError?.(error);
  }, [gameUrl, onError]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setIframeError(null);
    if (iframeRef.current) {
      iframeRef.current.src = getFinalUrl();
    }
  }, [getFinalUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);

  const finalUrl = getFinalUrl();

  return (
    <Card
      className={cn(
        "overflow-hidden ring-1 ring-border bg-card",
        height,
        width,
        className
      )}
    >
      <CardContent className="p-0 h-full relative">
        <GameErrorBoundary gameId={gameId} onError={onError}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          )}

          {hasError && !isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm p-8">
              <AlertTriangle className="size-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Game</h3>
              <p className="text-muted-foreground text-sm text-center mb-6 max-w-md">
                {iframeError?.message || "An error occurred while loading the game. Please try again."}
              </p>
              <Button
                onClick={handleRetry}
                variant="default"
                size="default"
                className="gap-2"
              >
                <RefreshCw className="size-4" />
                Retry
              </Button>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={finalUrl}
            title={`Game: ${gameId}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allowFullScreen
          />
        </GameErrorBoundary>
      </CardContent>
    </Card>
  );
}

export default GamePlayer;
