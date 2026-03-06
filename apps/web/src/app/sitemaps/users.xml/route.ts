import type { Route } from "next";
import {
  buildSitemapIndexXml,
  buildUrlSetXml,
  createSitemapResponse,
  getPublicUserCount,
  getPublicUserEntries,
  getSitemapPageCount,
  toAbsoluteUrl,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const totalUsers = await getPublicUserCount();
  const pageCount = getSitemapPageCount(totalUsers);

  if (pageCount <= 1) {
    const xml = buildUrlSetXml(await getPublicUserEntries(1));
    return createSitemapResponse(xml);
  }

  const xml = buildSitemapIndexXml(
    Array.from({ length: pageCount }, (_, index) => ({
      loc: toAbsoluteUrl(`/sitemaps/users/${index + 1}` as Route),
    })),
  );

  return createSitemapResponse(xml);
}
