import {
  buildUrlSetXml,
  createSitemapResponse,
  getGeneralSitemapEntries,
  getMagazineThemeEntries,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const xml = buildUrlSetXml([
    ...getGeneralSitemapEntries(),
    ...(await getMagazineThemeEntries()),
  ]);
  return createSitemapResponse(xml);
}
