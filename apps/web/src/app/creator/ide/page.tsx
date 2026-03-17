"use client";

import { use } from "react";
import { IDELayout } from "@/components/creator/ide";

interface IDEPageProps {
  searchParams?: Promise<{
    promptId?: string;
    forkId?: string;
  }>;
}

export default function IDEPage({ searchParams }: IDEPageProps) {
  const resolvedSearchParams = use(
    searchParams || Promise.resolve({ promptId: undefined, forkId: undefined })
  );

  return (
    <IDELayout
      urlPromptId={resolvedSearchParams?.promptId}
      urlForkId={resolvedSearchParams?.forkId}
    />
  );
}
