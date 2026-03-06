import type { Route } from "next";
import {
  buildSitemapIndexXml,
  buildUrlSetXml,
  createSitemapResponse,
  getActiveModelCount,
  getActiveModelEntries,
  getSitemapPageCount,
  toAbsoluteUrl,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const totalModels = await getActiveModelCount();
  const pageCount = getSitemapPageCount(totalModels);

  if (pageCount <= 1) {
    const xml = buildUrlSetXml(await getActiveModelEntries(1));
    return createSitemapResponse(xml);
  }

  const xml = buildSitemapIndexXml(
    Array.from({ length: pageCount }, (_, index) => ({
      loc: toAbsoluteUrl(`/sitemaps/models/${index + 1}` as Route),
    })),
  );

  return createSitemapResponse(xml);
}
