"use client";

import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Calendar, Gamepad2, GitFork, Star } from "lucide-react";

import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

export function GalleryPromptsList() {
  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ["prompts", "listPublic"],
    queryFn: async () => {
      return await trpcClient.prompts.listPublic.query();
    },
  });

  if (isLoading) {
    return <LoadingState centered message="Loading prompts..." />;
  }

  if (error || !prompts || prompts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10">
        <EmptyState
          title="No public prompts"
          message="No public prompts have been created yet."
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 text-center">
          <Link
            href={"/prompts" as Route}
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
          >
            <LayoutGrid className="h-4 w-4" />
            Back to Hub
          </Link>
          <h1 className="text-3xl font-bold">Prompts - Gallery View</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Browse prompts as beautiful visual cards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Link key={prompt.id} href={`/prompts/gallery/${prompt.id}` as Route}>
              <ArcadeCard className="h-full p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:scale-[1.02] cursor-pointer">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                    <ArcadeBadge text={prompt.visibility} variant="neon" />
                  </div>
                  
                  <pre className="text-sm text-[var(--muted-foreground)] line-clamp-4 whitespace-pre-wrap flex-1 mb-4">
                    {prompt.content.slice(0, 150)}{prompt.content.length > 150 ? "..." : ""}
                  </pre>
                  
                  <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] pt-3 border-t border-[var(--border)]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>{prompt.tokenCount} tokens</span>
                  </div>
                </div>
              </ArcadeCard>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
