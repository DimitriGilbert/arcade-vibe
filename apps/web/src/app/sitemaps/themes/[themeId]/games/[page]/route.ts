import { notFound } from "next/navigation";
import {
  buildUrlSetXml,
  createSitemapResponse,
  getSitemapPageCount,
  getThemeGameEntries,
  getThemeSummary,
  parseSitemapPageParam,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface ThemeGameSitemapRouteProps {
  params: Promise<{
    themeId: string;
    page: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ThemeGameSitemapRouteProps,
): Promise<Response> {
  const { themeId, page: pageParam } = await params;
  const page = parseSitemapPageParam(pageParam);

  if (page === null) {
    notFound();
  }

  const theme = await getThemeSummary(themeId);

  if (!theme || theme.gameCount === 0) {
    notFound();
  }

  if (page > getSitemapPageCount(theme.gameCount)) {
    notFound();
  }

  const xml = buildUrlSetXml(await getThemeGameEntries(themeId, page));
  return createSitemapResponse(xml);
}
