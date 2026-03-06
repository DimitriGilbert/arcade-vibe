import { notFound } from "next/navigation";
import {
  buildUrlSetXml,
  createSitemapResponse,
  getSitemapPageCount,
  getThemePromptEntries,
  getThemeSummary,
  parseSitemapPageParam,
} from "@/lib/sitemap";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

interface ThemePromptSitemapRouteProps {
  params: Promise<{
    themeId: string;
    page: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ThemePromptSitemapRouteProps,
): Promise<Response> {
  const { themeId, page: pageParam } = await params;
  const page = parseSitemapPageParam(pageParam);

  if (page === null) {
    notFound();
  }

  const theme = await getThemeSummary(themeId);

  if (!theme || theme.promptCount === 0) {
    notFound();
  }

  if (page > getSitemapPageCount(theme.promptCount)) {
    notFound();
  }

  const xml = buildUrlSetXml(await getThemePromptEntries(themeId, page));
  return createSitemapResponse(xml);
}
