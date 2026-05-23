const DEFAULT_SITE_URL = "http://localhost:3000";

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function getSiteUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL);
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}
