import {
  buildUrlSetXml,
  createSitemapResponse,
  getGeneralSitemapEntries,
} from "@/lib/sitemap";

export const revalidate = 3600;

export function GET(): Response {
  const xml = buildUrlSetXml(getGeneralSitemapEntries());
  return createSitemapResponse(xml);
}
