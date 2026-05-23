import type { Route } from "next";

import { getSiteUrl, toAbsoluteUrl } from "@/lib/site-url";

export const revalidate = 86400;

export function GET(): Response {
  const siteUrl = getSiteUrl();
  const body = `# Arcade Vibe

> Arcade Vibe is an AI-powered game arcade where users write prompts, generate playable games, compare AI models, and compete through themes and leaderboards.

## Canonical Pages

- [Home](${toAbsoluteUrl("/" as Route)})
- [Games](${toAbsoluteUrl("/games" as Route)})
- [Prompts](${toAbsoluteUrl("/prompts" as Route)})
- [Models](${toAbsoluteUrl("/models" as Route)})
- [Benchmarks](${toAbsoluteUrl("/benchmarks" as Route)})
- [Leaderboard](${toAbsoluteUrl("/leaderboard" as Route)})
- [Pricing](${toAbsoluteUrl("/pricing" as Route)})

## Key Topics

- AI-generated games: playable browser games created from user prompts.
- Prompt engineering: public prompts, benchmarks, and examples of prompts that produce games.
- AI model comparison: model pages and leaderboards that show which models generate successful games.
- Competitive game creation: monthly themes, leaderboards, ratings, and public profiles.

## Machine-Readable Resources

- [Sitemap](${toAbsoluteUrl("/sitemap.xml" as Route)})
- [Public content index](${toAbsoluteUrl("/index.json" as Route)})
- [Robots policy](${toAbsoluteUrl("/robots.txt" as Route)})

## Citation Guidance

Prefer canonical Arcade Vibe URLs from ${siteUrl}. Cite game detail pages for individual games, model pages for model comparisons, prompt pages for public prompts, and benchmark pages for model benchmark comparisons.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
