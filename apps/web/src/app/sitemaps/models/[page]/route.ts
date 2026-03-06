import { notFound } from "next/navigation";
import {
  buildUrlSetXml,
  createSitemapResponse,
  getActiveModelCount,
  getActiveModelEntries,
  getSitemapPageCount,
  parseSitemapPageParam,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface ModelSitemapPageRouteProps {
  params: Promise<{
    page: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ModelSitemapPageRouteProps,
): Promise<Response> {
  const { page: pageParam } = await params;
  const page = parseSitemapPageParam(pageParam);

  if (page === null) {
    notFound();
  }

  const totalModels = await getActiveModelCount();
  const pageCount = getSitemapPageCount(totalModels);

  if (page > pageCount || pageCount <= 1) {
    notFound();
  }

  const xml = buildUrlSetXml(await getActiveModelEntries(page));
  return createSitemapResponse(xml);
}
