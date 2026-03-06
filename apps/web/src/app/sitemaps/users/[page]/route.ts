import { notFound } from "next/navigation";
import {
  buildUrlSetXml,
  createSitemapResponse,
  getPublicUserCount,
  getPublicUserEntries,
  getSitemapPageCount,
  parseSitemapPageParam,
} from "@/lib/sitemap";

export const revalidate = 3600;

interface UserSitemapPageRouteProps {
  params: Promise<{
    page: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: UserSitemapPageRouteProps,
): Promise<Response> {
  const { page: pageParam } = await params;
  const page = parseSitemapPageParam(pageParam);

  if (page === null) {
    notFound();
  }

  const totalUsers = await getPublicUserCount();
  const pageCount = getSitemapPageCount(totalUsers);

  if (page > pageCount || pageCount <= 1) {
    notFound();
  }

  const xml = buildUrlSetXml(await getPublicUserEntries(page));
  return createSitemapResponse(xml);
}
