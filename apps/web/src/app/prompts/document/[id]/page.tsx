import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { trpcClient } from "@/utils/trpc";
import DocumentEditorClient from "@/components/prompts/document-editor-client";

interface PromptDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["prompts", "public", id],
      queryFn: async () => {
        return await trpcClient.prompts.getPublicById.query({ id });
      },
    });
  } catch (error) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DocumentEditorClient promptId={id} />
    </HydrationBoundary>
  );
}
