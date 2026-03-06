import {
  buildUrlSetXml,
  createSitemapResponse,
  getGeneralSitemapEntries,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export function GET(): Response {
  const xml = buildUrlSetXml(getGeneralSitemapEntries());
  return createSitemapResponse(xml);
}
