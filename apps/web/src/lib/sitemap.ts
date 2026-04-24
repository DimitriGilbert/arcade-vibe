import type { Route } from "next";
import { db } from "@arcade-vibe/db";
import { user } from "@arcade-vibe/db/schema/auth";
import { games } from "@arcade-vibe/db/schema/games";
import { modelConfig } from "@arcade-vibe/db/schema/models";
import { prompts } from "@arcade-vibe/db/schema/prompts";
import { themes } from "@arcade-vibe/db/schema/themes";
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getModelDetailRoute } from "@/lib/model-routes";

export const SITEMAP_PAGE_SIZE = 40000;
const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const;

type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: SitemapChangeFrequency;
  priority?: number;
}

interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

const PUBLIC_GAME_CONDITION = and(
  eq(games.status, "completed"),
  eq(games.isSubmitted, true),
  eq(games.isHidden, false),
  isNull(games.deletedAt),
);

const PUBLIC_PROMPT_CONDITION = and(
  eq(prompts.visibility, "public"),
  isNull(prompts.hiddenAt),
);

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function getSiteUrl(): string {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  );
}

export function toAbsoluteUrl(path: Route): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

function optionalTag(tagName: string, value?: string | number): string {
  if (value === undefined) {
    return "";
  }

  return `<${tagName}>${xmlEscape(String(value))}</${tagName}>`;
}

export function createSitemapResponse(xml: string): Response {
  return new Response(xml, {
    headers: XML_HEADERS,
  });
}

export function buildUrlSetXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map(
      (entry) =>
        `<url><loc>${xmlEscape(entry.loc)}</loc>${optionalTag("lastmod", entry.lastmod)}${optionalTag("changefreq", entry.changefreq)}${optionalTag("priority", entry.priority)}</url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map(
      (entry) =>
        `<sitemap><loc>${xmlEscape(entry.loc)}</loc>${optionalTag("lastmod", entry.lastmod)}</sitemap>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function getSitemapPageCount(totalItems: number): number {
  if (totalItems <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / SITEMAP_PAGE_SIZE);
}

export function parseSitemapPageParam(pageParam: string): number | null {
  const page = Number.parseInt(pageParam, 10);

  if (!Number.isInteger(page) || page < 1) {
    return null;
  }

  return page;
}

export function getGeneralSitemapEntries(): SitemapUrlEntry[] {
  return [
    { loc: toAbsoluteUrl("/" as Route), changefreq: "daily", priority: 1 },
    { loc: toAbsoluteUrl("/games" as Route), changefreq: "hourly", priority: 0.9 },
    { loc: toAbsoluteUrl("/models" as Route), changefreq: "weekly", priority: 0.8 },
    { loc: toAbsoluteUrl("/prompts" as Route), changefreq: "daily", priority: 0.8 },
    { loc: toAbsoluteUrl("/leaderboard" as Route), changefreq: "daily", priority: 0.8 },
    {
      loc: toAbsoluteUrl("/leaderboard/arena" as Route),
      changefreq: "daily",
      priority: 0.7,
    },
    {
      loc: toAbsoluteUrl("/leaderboard/dashboard" as Route),
      changefreq: "daily",
      priority: 0.7,
    },
    {
      loc: toAbsoluteUrl("/leaderboard/magazine" as Route),
      changefreq: "daily",
      priority: 0.7,
    },
    { loc: toAbsoluteUrl("/pricing" as Route), changefreq: "weekly", priority: 0.6 },
    { loc: toAbsoluteUrl("/privacy" as Route), changefreq: "yearly", priority: 0.3 },
    { loc: toAbsoluteUrl("/terms" as Route), changefreq: "yearly", priority: 0.3 },
  ];
}

export async function getBenchmarkEntries(): Promise<SitemapUrlEntry[]> {
  const rows = await db.query.prompts.findMany({
    where: and(
      eq(prompts.isBenchmark, true),
      isNull(prompts.hiddenAt),
    ),
    columns: {
      id: true,
      updatedAt: true,
    },
    orderBy: [desc(prompts.updatedAt)],
  });

  return rows.map((row) => ({
    loc: toAbsoluteUrl(`/benchmarks/${row.id}` as Route),
    lastmod: toIsoString(row.updatedAt),
    changefreq: "daily",
    priority: 0.8,
  }));
}

export async function getMagazineThemeEntries(): Promise<SitemapUrlEntry[]> {
  const rows = await db
    .selectDistinct({
      id: themes.id,
      updatedAt: themes.updatedAt,
    })
    .from(themes)
    .leftJoin(prompts, eq(prompts.themeId, themes.id))
    .leftJoin(games, eq(games.themeId, themes.id))
    .where(or(PUBLIC_PROMPT_CONDITION, PUBLIC_GAME_CONDITION))
    .orderBy(desc(themes.updatedAt), asc(themes.id));

  return rows.map((row) => {
    const url = new URL(toAbsoluteUrl("/leaderboard/magazine" as Route));
    url.searchParams.set("themeId", row.id);

    return {
      loc: url.toString(),
      lastmod: toIsoString(row.updatedAt),
      changefreq: "daily",
      priority: 0.7,
    };
  });
}

export async function getPublicUserCount(): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(distinct ${user.id})`,
    })
    .from(user)
    .innerJoin(prompts, eq(prompts.authorId, user.id))
    .leftJoin(games, eq(games.promptId, prompts.id))
    .where(or(PUBLIC_PROMPT_CONDITION, PUBLIC_GAME_CONDITION));

  return Number(result?.count ?? 0);
}

export async function getPublicUserEntries(page: number): Promise<SitemapUrlEntry[]> {
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;

  const rows = await db
    .selectDistinct({
      id: user.id,
      name: user.name,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .innerJoin(prompts, eq(prompts.authorId, user.id))
    .leftJoin(games, eq(games.promptId, prompts.id))
    .where(or(PUBLIC_PROMPT_CONDITION, PUBLIC_GAME_CONDITION))
    .orderBy(desc(user.updatedAt), asc(user.id))
    .limit(SITEMAP_PAGE_SIZE)
    .offset(offset);

  return rows.map((row) => ({
    loc: toAbsoluteUrl(`/profile/${encodeURIComponent(row.name)}` as Route),
    lastmod: toIsoString(row.updatedAt),
    changefreq: "daily",
    priority: 0.7,
  }));
}

export async function getActiveModelCount(): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(modelConfig)
    .where(eq(modelConfig.isActive, true));

  return Number(result?.count ?? 0);
}

export async function getActiveModelEntries(page: number): Promise<SitemapUrlEntry[]> {
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;

  const rows = await db.query.modelConfig.findMany({
    where: eq(modelConfig.isActive, true),
    columns: {
      id: true,
      modelName: true,
      updatedAt: true,
    },
    orderBy: [desc(modelConfig.updatedAt), asc(modelConfig.id)],
    limit: SITEMAP_PAGE_SIZE,
    offset,
  });

  return rows.map((row) => ({
    loc: toAbsoluteUrl(getModelDetailRoute(row.modelName, row.id)),
    lastmod: toIsoString(row.updatedAt),
    changefreq: "weekly",
    priority: 0.6,
  }));
}

export async function getThemeIndexEntries(): Promise<SitemapIndexEntry[]> {
  const rows = await db
    .selectDistinct({
      id: themes.id,
      updatedAt: themes.updatedAt,
    })
    .from(themes)
    .leftJoin(prompts, eq(prompts.themeId, themes.id))
    .leftJoin(games, eq(games.themeId, themes.id))
    .where(or(PUBLIC_PROMPT_CONDITION, PUBLIC_GAME_CONDITION))
    .orderBy(desc(themes.updatedAt), asc(themes.id));

  return rows.map((row) => ({
    loc: toAbsoluteUrl(`/sitemaps/themes/${row.id}` as Route),
    lastmod: toIsoString(row.updatedAt),
  }));
}

export async function getThemeSummary(themeId: string): Promise<{
  exists: boolean;
  updatedAt: string;
  gameCount: number;
  promptCount: number;
} | null> {
  const theme = await db.query.themes.findFirst({
    where: eq(themes.id, themeId),
    columns: {
      id: true,
      updatedAt: true,
    },
  });

  if (!theme) {
    return null;
  }

  const [gameResult, promptResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(games)
      .where(and(eq(games.themeId, themeId), PUBLIC_GAME_CONDITION)),
    db
      .select({ count: count() })
      .from(prompts)
      .where(and(eq(prompts.themeId, themeId), PUBLIC_PROMPT_CONDITION)),
  ]);

  return {
    exists: true,
    updatedAt: toIsoString(theme.updatedAt),
    gameCount: Number(gameResult[0]?.count ?? 0),
    promptCount: Number(promptResult[0]?.count ?? 0),
  };
}

export async function getThemeGameEntries(
  themeId: string,
  page: number,
): Promise<SitemapUrlEntry[]> {
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;

  const rows = await db.query.games.findMany({
    where: and(eq(games.themeId, themeId), PUBLIC_GAME_CONDITION),
    columns: {
      id: true,
      updatedAt: true,
    },
    orderBy: [desc(games.updatedAt), asc(games.id)],
    limit: SITEMAP_PAGE_SIZE,
    offset,
  });

  return rows.map((row) => ({
    loc: toAbsoluteUrl(`/games/${row.id}` as Route),
    lastmod: toIsoString(row.updatedAt),
    changefreq: "weekly",
    priority: 0.8,
  }));
}

export async function getThemePromptEntries(
  themeId: string,
  page: number,
): Promise<SitemapUrlEntry[]> {
  const offset = (page - 1) * SITEMAP_PAGE_SIZE;

  const rows = await db.query.prompts.findMany({
    where: and(eq(prompts.themeId, themeId), PUBLIC_PROMPT_CONDITION),
    columns: {
      id: true,
      updatedAt: true,
    },
    orderBy: [desc(prompts.updatedAt), asc(prompts.id)],
    limit: SITEMAP_PAGE_SIZE,
    offset,
  });

  return rows.map((row) => ({
    loc: toAbsoluteUrl(`/prompts/${row.id}` as Route),
    lastmod: toIsoString(row.updatedAt),
    changefreq: "weekly",
    priority: 0.7,
  }));
}

export function getThemeSitemapChildEntries(
  themeId: string,
  updatedAt: string,
  gameCount: number,
  promptCount: number,
): SitemapIndexEntry[] {
  const entries: SitemapIndexEntry[] = [];
  const gamePageCount = getSitemapPageCount(gameCount);
  const promptPageCount = getSitemapPageCount(promptCount);

  for (let page = 1; page <= gamePageCount; page += 1) {
    entries.push({
      loc: toAbsoluteUrl(`/sitemaps/themes/${themeId}/games/${page}` as Route),
      lastmod: updatedAt,
    });
  }

  for (let page = 1; page <= promptPageCount; page += 1) {
    entries.push({
      loc: toAbsoluteUrl(
        `/sitemaps/themes/${themeId}/prompts/${page}` as Route,
      ),
      lastmod: updatedAt,
    });
  }

  return entries;
}
