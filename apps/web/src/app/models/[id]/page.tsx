import ModelPageClient from "./model-page-client";

interface ModelDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params;

  return <ModelPageClient modelId={id} />;
}
