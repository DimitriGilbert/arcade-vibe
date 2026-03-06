import type { Route } from "next";
import {
  buildSitemapIndexXml,
  createSitemapResponse,
  getThemeIndexEntries,
  toAbsoluteUrl,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const themeEntries = await getThemeIndexEntries();
  const xml = buildSitemapIndexXml([
    { loc: toAbsoluteUrl("/sitemaps/general.xml" as Route) },
    { loc: toAbsoluteUrl("/sitemaps/users.xml" as Route) },
    { loc: toAbsoluteUrl("/sitemaps/models.xml" as Route) },
    ...themeEntries,
  ]);

  return createSitemapResponse(xml);
}
