import { allowedLibraryPatterns } from "@arcade-vibe/db/schema/library-patterns";

type AllowedLibraryPattern = typeof allowedLibraryPatterns.$inferSelect;

const SCRIPT_TAG_REGEX = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
const INLINE_SCRIPT_REGEX = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

export interface SanitizationResult {
  sanitizedHtml: string;
  blockedUrls: string[];
  blockedInlineScripts: number;
  allowedUrls: string[];
}

export function extractCodeFromMarkdown(text: string): string {
  const codeBlockRegex = /```(?:html|htm)?\s*\n?([\s\S]*?)\n?```/g;
  const matches = [...text.matchAll(codeBlockRegex)];

  if (matches.length > 0 && matches[0]?.[1]) {
    return matches[0][1].trim();
  }
  return text.trim();
}

export function extractScriptUrls(html: string): string[] {
  const urls: string[] = [];
  const matches = html.matchAll(SCRIPT_TAG_REGEX);

  for (const match of matches) {
    const url = match[1];
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

export function extractInlineScriptCount(html: string): number {
  const matches = html.match(INLINE_SCRIPT_REGEX);
  return matches ? matches.length : 0;
}

export function isUrlAllowed(
  url: string,
  patterns: AllowedLibraryPattern[],
): boolean {
  for (const pattern of patterns) {
    // Split by newlines - database stores multiple patterns per row
    const patternLines = pattern.urlPattern.split("\n").filter(Boolean);
    for (const patternStr of patternLines) {
      try {
        const regex = new RegExp(patternStr);
        if (regex.test(url)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }
  return false;
}

export function sanitizeGameCode(
  html: string,
  patterns: AllowedLibraryPattern[],
): SanitizationResult {
  const blockedUrls: string[] = [];
  const allowedUrls: string[] = [];
  let blockedInlineScripts = 0;

  const sanitizeScriptTags = (input: string): string => {
    return input.replace(SCRIPT_TAG_REGEX, (match, url) => {
      if (isUrlAllowed(url, patterns)) {
        allowedUrls.push(url);
        return match;
      }
      blockedUrls.push(url);
      return `<!-- BLOCKED SCRIPT: ${url} -->`;
    });
  };

  let sanitized = sanitizeScriptTags(html);

  return {
    sanitizedHtml: sanitized,
    blockedUrls,
    blockedInlineScripts,
    allowedUrls,
  };
}

export function buildLibraryListForSystemPrompt(
  patterns: AllowedLibraryPattern[],
): string {
  if (patterns.length === 0) {
    return "";
  }

  const libraryList = patterns
    .map((p) => {
      const status = p.status === "active" ? "" : "(disabled)";
      const scope = p.isGlobal ? "" : "(theme-specific)";
      return `- ${p.name} ${status} ${scope}`;
    })
    .join("\n");

  return `Available libraries for this theme:\n${libraryList}\n\nUse only these libraries in your generated code. Include proper script tags for any external libraries you use.`;
}

export function validateRegexPattern(pattern: string): {
  valid: boolean;
  error?: string;
} {
  try {
    new RegExp(pattern);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid regex",
    };
  }
}

export function testUrlPattern(url: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern);
    return regex.test(url);
  } catch {
    return false;
  }
}
