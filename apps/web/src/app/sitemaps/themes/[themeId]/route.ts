import { notFound } from "next/navigation";
import {
  buildSitemapIndexXml,
  createSitemapResponse,
  getThemeSitemapChildEntries,
  getThemeSummary,
} from "@/lib/sitemap";

export const revalidate = 3600;

interface ThemeSitemapRouteProps {
  params: Promise<{
    themeId: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: ThemeSitemapRouteProps,
): Promise<Response> {
  const { themeId } = await params;
  const theme = await getThemeSummary(themeId);

  if (!theme || (theme.gameCount === 0 && theme.promptCount === 0)) {
    notFound();
  }

  const xml = buildSitemapIndexXml(
    getThemeSitemapChildEntries(
      themeId,
      theme.updatedAt,
      theme.gameCount,
      theme.promptCount,
    ),
  );

  return createSitemapResponse(xml);
}
