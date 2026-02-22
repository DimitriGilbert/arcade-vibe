import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { GalleryPromptsList } from "./gallery-prompts-list";

export const metadata: Metadata = {
  title: "Prompts - Gallery View | Arcade Vibe",
  description: "Browse public prompts in a visual card-based gallery.",
};

export default async function GalleryPromptsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["prompts", "listPublic"],
    queryFn: async () => {
      return await trpcClient.prompts.listPublic.query();
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GalleryPromptsList />
    </HydrationBoundary>
  );
}
