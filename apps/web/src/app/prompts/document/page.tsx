import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { DocumentPromptsList } from "./document-prompts-list";

export const metadata: Metadata = {
  title: "Prompts - Document View | Arcade Vibe",
  description: "Browse public prompts in a document-style view.",
};

export default async function DocumentPromptsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["prompts", "listPublic"],
    queryFn: async () => {
      return await trpcClient.prompts.listPublic.query();
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DocumentPromptsList />
    </HydrationBoundary>
  );
}
