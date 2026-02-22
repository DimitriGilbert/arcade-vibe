"use client";

import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, Calendar } from "lucide-react";

import { ArcadeCard, ArcadeBadge } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import { trpcClient } from "@/utils/trpc";

export function DocumentPromptsList() {
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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link
            href={"/prompts" as Route}
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
          >
            <FileText className="h-4 w-4" />
            Back to Hub
          </Link>
          <h1 className="text-3xl font-bold">Prompts - Document View</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Browse prompts in a clean, document-style list.
          </p>
        </div>

        <div className="space-y-4">
          {prompts.map((prompt) => (
            <Link key={prompt.id} href={`/prompts/document/${prompt.id}` as Route}>
              <ArcadeCard className="p-4 transition-all duration-200 hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/20 cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ArcadeBadge text={`v${prompt.version}`} variant="default" />
                      <ArcadeBadge text={prompt.visibility} variant="default" />
                    </div>
                    <pre className="text-sm text-[var(--muted-foreground)] line-clamp-3 whitespace-pre-wrap">
                      {prompt.content.slice(0, 200)}{prompt.content.length > 200 ? "..." : ""}
                    </pre>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{prompt.tokenCount} tokens</span>
                    </div>
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
