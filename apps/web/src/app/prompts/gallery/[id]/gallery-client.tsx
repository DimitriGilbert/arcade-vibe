"use client";

import type { PromptGetPublicByIdOutput } from "@/lib/trpc-types";

import { ArcadeCard } from "@/components/arcade";
import { LoadingState, EmptyState } from "@/components/reusable";
import {
  HeroSection,
  TopGamesSection,
  AllGamesSection,
  NoGamesEmpty,
  ForksSection,
  useGalleryData,
} from "@/components/prompts/gallery";
import { authClient } from "@/lib/auth-client";

interface GalleryClientProps {
  promptId: string;
  initialPrompt?: PromptGetPublicByIdOutput;
}

export default function GalleryClient({ promptId, initialPrompt }: GalleryClientProps) {
  const { data: session } = authClient.useSession();

  const {
    prompt,
    gamesData,
    forks,
    top3,
    rest,
    isPromptLoading,
    isGamesLoading,
    isForksLoading,
    isForking,
    handleFork,
    handleShare,
  } = useGalleryData(promptId, initialPrompt);

  if (isPromptLoading) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <LoadingState size="lg" centered message="Loading prompt gallery..." />
        </div>
      </main>
    );
  }

  if (!prompt) {
    return (
      <main className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <EmptyState title="Prompt not found" message="This prompt does not exist or is not public." />
        </div>
      </main>
    );
  }

  const contentPreview = prompt.content.length > 150
    ? `${prompt.content.slice(0, 150)}...`
    : prompt.content;

  return (
    <main className="min-h-screen bg-background pb-12">
      <HeroSection
        contentPreview={contentPreview}
        author={prompt.author}
        theme={prompt.theme}
        stats={prompt.stats}
        onPlayBest={top3[0] ? () => { window.location.href = `/game/${top3[0].id}`; } : undefined}
        onFork={handleFork}
        onShare={handleShare}
        isForking={isForking}
        isLoggedIn={!!session?.user}
      />

      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {gamesData?.items && gamesData.items.length > 0 && (
          <>
            <TopGamesSection top3={top3} />
            <AllGamesSection games={rest} startRank={4} />
          </>
        )}

        {isGamesLoading && (
          <ArcadeCard className="p-8">
            <LoadingState message="Loading games..." />
          </ArcadeCard>
        )}

        {!isGamesLoading && gamesData?.items?.length === 0 && (
          <NoGamesEmpty
            isLoggedIn={!!session?.user}
            onFork={handleFork}
            isForking={isForking}
          />
        )}

        {!isForksLoading && forks && forks.length > 0 && (
          <ForksSection forks={forks} />
        )}
      </div>
    </main>
  );
}
