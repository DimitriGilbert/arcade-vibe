import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { PromptDashboardClient } from "./dashboard-client";

interface PromptDashboardPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDashboardPage({ params }: PromptDashboardPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["prompt-public", id],
      queryFn: async () => {
        return await trpcClient.prompts.getPublicById.query({ id });
      },
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PromptDashboardClient promptId={id} />
    </HydrationBoundary>
  );
}
