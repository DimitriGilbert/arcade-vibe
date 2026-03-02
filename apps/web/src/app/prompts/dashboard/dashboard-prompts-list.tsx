"use client";

import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SplitSquareHorizontal, Calendar, Gamepad2, GitFork, ExternalLink } from "lucide-react";

import { ArcadeCard, ArcadeBadge, ArcadeButton } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

export function DashboardPromptsList() {
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
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0">
          <aside className="lg:col-span-3 lg:sticky lg:top-0 lg:h-screen border-r border-[var(--border)] bg-[var(--card)] p-4">
            <Link
              href={"/prompts" as Route}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
              Back to Hub
            </Link>
            <h1 className="text-2xl font-bold mb-2">Prompts Dashboard</h1>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Browse prompts in a power-user table view.
            </p>
            
            <div className="space-y-2">
              <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
                <p className="text-2xl font-bold">{prompts.length}</p>
                <p className="text-xs text-[var(--muted-foreground)] uppercase">Public Prompts</p>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9 p-4 lg:p-6">
            <ArcadeCard>
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-semibold">All Prompts</h2>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    ({prompts.length})
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {prompts.map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/dashboard/${prompt.id}` as Route}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]/20 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                        <ArcadeBadge text={prompt.visibility} variant="default" />
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] line-clamp-1">
                        {prompt.title || `${prompt.content.slice(0, 100)}${prompt.content.length > 100 ? "..." : ""}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="text-xs text-[var(--muted-foreground)]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {prompt.tokenCount} tokens
                      </div>
                      <ExternalLink className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </ArcadeCard>
          </main>
        </div>
      </div>
    </main>
  );
}
