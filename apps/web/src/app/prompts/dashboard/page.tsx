import type { Metadata } from "next";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import { DashboardPromptsList } from "./dashboard-prompts-list";

export const metadata: Metadata = {
  title: "Prompts - Dashboard View | Arcade Vibe",
  description: "Browse public prompts in a split-panel dashboard view.",
};

export default async function DashboardPromptsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["prompts", "listPublic"],
    queryFn: async () => {
      return await trpcClient.prompts.listPublic.query();
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPromptsList />
    </HydrationBoundary>
  );
}
