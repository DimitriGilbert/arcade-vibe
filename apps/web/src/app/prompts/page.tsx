import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { DocumentPromptsList } from "@/components/prompts/document-prompts-list";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";
import { getServerCaller } from "@/utils/trpc-server";

const PAGE_SIZE = 25;

interface PromptsPageProps {
  searchParams?: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Prompt Library | Arcade Vibe",
  description: "Discover curated AI prompts crafted by the community. Browse, learn, and get inspired by public prompts in our library.",
};

function parsePageParam(value: string | undefined): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const caller = await getServerCaller();
  const resolvedSearchParams =
    (await searchParams) ?? ({ page: undefined } as { page?: string });
  const page = parsePageParam(resolvedSearchParams.page);

  const [result, themes] = await Promise.all([
    caller.prompts.listPublicPaginated({
      page,
      pageSize: PAGE_SIZE,
    }),
    caller.themes.list(),
  ]);

  if (result.totalPages > 0 && page > result.totalPages) {
    notFound();
  }

  return (
    <>
      <JsonLd
        id="prompts-json-ld"
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${toAbsoluteUrl("/prompts")}#collection`,
          name: "Prompt Library",
          url: toAbsoluteUrl("/prompts"),
          description:
            "Discover public prompts crafted by the Arcade Vibe community for AI-generated games.",
          inLanguage: "en",
          isPartOf: {
            "@id": `${getSiteUrl()}/#website`,
          },
        }}
      />
      <DocumentPromptsList
        prompts={result.items}
        themes={themes.map((t) => ({ id: t.id, title: t.title }))}
        currentPage={page}
        totalPages={result.totalPages}
        totalItems={result.total}
        hasNextPage={result.hasNextPage}
        hasPreviousPage={result.hasPreviousPage}
      />
    </>
  );
}
