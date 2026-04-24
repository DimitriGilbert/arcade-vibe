import { useCallback, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { trpcClient } from "@/utils/trpc";

interface UseGameScreenshotOptions {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  gameId: string | null;
}

export function useGameScreenshot({ iframeRef, gameId }: UseGameScreenshotOptions) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureScreenshot = useCallback(async () => {
    if (!gameId) {
      toast.error("No game ID available");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) {
      toast.error("Game is not loaded yet");
      return;
    }

    const contentDocument = iframe.contentDocument;
    if (!contentDocument) {
      toast.error("Cannot capture screenshot — game may be loading");
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = contentDocument.querySelector("canvas");
      let imageDataUrl: string;

      if (canvas && canvas.width > 0 && canvas.height > 0) {
        imageDataUrl = canvas.toDataURL("image/png");
      } else {
        const html2canvas = (await import("html2canvas")).default;
        const result = await html2canvas(contentDocument.body, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        imageDataUrl = result.toDataURL("image/png");
      }

      await trpcClient.games.saveThumbnail.mutate({ gameId, imageDataUrl });
      toast.success("Screenshot saved!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to capture screenshot";
      toast.error(message);
    } finally {
      setIsCapturing(false);
    }
  }, [gameId, iframeRef]);

  return { captureScreenshot, isCapturing };
}
