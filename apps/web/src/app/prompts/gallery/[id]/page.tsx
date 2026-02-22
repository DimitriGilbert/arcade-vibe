import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import GalleryClient from "./gallery-client";
import { trpcClient } from "@/utils/trpc";

interface GalleryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: GalleryPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const prompt = await trpcClient.prompts.getPublicById.query({ id });

    if (!prompt) {
      return {
        title: "Prompt Not Found - Arcade Vibe",
      };
    }

    const contentPreview = prompt.content.slice(0, 60);
    const themeTitle = prompt.theme?.title ?? "Arcade Vibe";

    return {
      title: `Prompt Gallery - ${themeTitle} | Arcade Vibe`,
      description: `"${contentPreview}..." - ${prompt.stats.gameCount} games, ${prompt.stats.forkCount} forks. Theme: ${themeTitle}`,
      openGraph: {
        title: `Prompt Gallery - ${themeTitle}`,
        description: `${prompt.stats.gameCount} games generated from this prompt. Average rating: ${prompt.stats.avgRating.toFixed(1)}/5`,
      },
    };
  } catch {
    return {
      title: "Prompt Gallery - Arcade Vibe",
    };
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["prompts", "getPublicById", id],
      queryFn: async () => {
        return await trpcClient.prompts.getPublicById.query({ id });
      },
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GalleryClient promptId={id} />
    </HydrationBoundary>
  );
}
