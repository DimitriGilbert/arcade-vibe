import type { Metadata } from "next";
import type { Route } from "next";

import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

import { JsonLd } from "@/components/JsonLd";
import { trpcClient } from "@/utils/trpc";
import DocumentEditorClient from "@/components/prompts/document-editor-client";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import type { PromptGetPublicByIdOutput } from "@/lib/trpc-types";

interface PromptDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PromptDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const prompt = await trpcClient.prompts.getPublicById.query({ id });
    const title = prompt.title ?? prompt.content.slice(0, 80);
    const description = prompt.content.slice(0, 160);

    return {
      title: `${title} | Prompt`,
      description,
      alternates: {
        canonical: `/prompts/${id}`,
      },
      openGraph: {
        title,
        description,
        type: "article",
        url: `/prompts/${id}`,
      },
    };
  } catch {
    return {
      title: "Prompt Not Found",
      description: "This public prompt could not be found.",
    };
  }
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;

  const queryClient = new QueryClient();
  const promptUrl = toAbsoluteUrl(`/prompts/${id}` as Route);

  let prompt: PromptGetPublicByIdOutput;
  try {
    prompt = await trpcClient.prompts.getPublicById.query({ id });
    queryClient.setQueryData(["prompts", "public", id], prompt);
  } catch {
    notFound();
  }

  const promptTitle = prompt.title ?? prompt.content.slice(0, 80);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd
        id="prompt-json-ld"
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": `${promptUrl}#prompt`,
            name: promptTitle,
            url: promptUrl,
            text: prompt.content,
            description: prompt.content.slice(0, 500),
            inLanguage: "en",
            author: {
              "@type": "Person",
              name: prompt.author?.name ?? "Arcade Vibe user",
            },
            publisher: {
              "@id": `${getSiteUrl()}/#organization`,
            },
            dateCreated: new Date(prompt.createdAt).toISOString(),
            dateModified: new Date(prompt.updatedAt).toISOString(),
            keywords: ["prompt", "AI game generation", prompt.theme?.title ?? "Arcade Vibe"],
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Prompts",
                item: toAbsoluteUrl("/prompts" as Route),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: promptTitle,
                item: promptUrl,
              },
            ],
          },
        ]}
      />
      <DocumentEditorClient promptId={id} />
    </HydrationBoundary>
  );
}
