"use client";

import { useCallback } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Copy, Download, GitFork, Play } from "lucide-react";
import { toast } from "sonner";

import { ArcadeButton } from "@/components/arcade";
import { trpcClient } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { generateEmbedCode } from "@/lib/embed-utils";

interface GameActionsClientProps {
  gameId: string;
  gameName: string | null;
  promptId: string | null;
}

export function GameActionsClient({
  gameId,
  gameName,
  promptId,
}: GameActionsClientProps) {
  const { data: session } = authClient.useSession();

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.games.exportPortable.query({ gameId: id });
    },
    onSuccess: (data) => {
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Game downloaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download game");
    },
  });

  const forkMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.prompts.fork.mutate({ promptId: id });
    },
    onSuccess: () => {
      toast.success("Prompt forked successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to fork prompt");
    },
  });

  const handleCopyEmbed = useCallback((id: string, name: string | null) => {
    const embedCode = generateEmbedCode({
      gameId: id,
      gameName: name ?? undefined,
    });
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={`/game/${gameId}` as Route}>
        <ArcadeButton variant="primary" size="sm">
          <Play className="h-3.5 w-3.5" />
          Play
        </ArcadeButton>
      </Link>
      {session?.user && promptId && (
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={() => forkMutation.mutate(promptId)}
          disabled={forkMutation.isPending}
        >
          <GitFork className="h-3.5 w-3.5" />
          Fork
        </ArcadeButton>
      )}
      {session?.user && (
        <ArcadeButton
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate(gameId)}
          disabled={downloadMutation.isPending}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </ArcadeButton>
      )}
      <ArcadeButton
        variant="outline"
        size="sm"
        onClick={() => handleCopyEmbed(gameId, gameName)}
      >
        <Copy className="h-3.5 w-3.5" />
        Embed
      </ArcadeButton>
    </div>
  );
}
