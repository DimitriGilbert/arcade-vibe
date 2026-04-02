import { allowedLibraryPatterns } from "@arcade-vibe/db/schema/library-patterns";

type AllowedLibraryPattern = typeof allowedLibraryPatterns.$inferSelect;

const SCRIPT_TAG_REGEX = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;

export interface SanitizationResult {
  sanitizedHtml: string;
  blockedUrls: string[];
  allowedUrls: string[];
}

export function extractCodeFromMarkdown(text: string): string {
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*\n?([\s\S]*?)\n?```/g;
  const matches = [...text.matchAll(codeBlockRegex)];

  if (matches.length === 0) {
    return text.trim();
  }

  const mergedParts = matches
    .map((match) => {
      const language = (match[1] ?? "").toLowerCase();
      const content = (match[2] ?? "").trim();

      if (!content) return "";

      if (language === "" || language === "html" || language === "htm") {
        return content;
      }

      if (language === "css") {
        return `<style>\n${content}\n</style>`;
      }

      if (
        language === "js" ||
        language === "javascript" ||
        language === "ts" ||
        language === "typescript"
      ) {
        return `<script>\n${content}\n</script>`;
      }

      return content;
    })
    .filter((part) => part.length > 0);

  const merged = mergedParts.join("\n\n").trim();
  return merged.length > 0 ? merged : text.trim();
}

export function normalizeGeneratedBodySnippet(html: string): string {
  let normalized = html.trim();

  normalized = normalized.replace(/<!doctype[^>]*>/gi, "");
  normalized = normalized.replace(/<\?xml[^>]*\?>/gi, "");

  const bodyMatch = normalized.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) {
    normalized = bodyMatch[1];
  }

  normalized = normalized.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  normalized = normalized.replace(/<\/?(html|head|body)\b[^>]*>/gi, "");

  return normalized.trim();
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

  const sanitized = html.replace(SCRIPT_TAG_REGEX, (match, url) => {
    if (isUrlAllowed(url, patterns)) {
      allowedUrls.push(url);
      return match;
    }
    blockedUrls.push(url);
    return `<!-- BLOCKED SCRIPT: ${url} -->`;
  });

  return {
    sanitizedHtml: sanitized,
    blockedUrls,
    allowedUrls,
  };
}

export function buildLibraryListForSystemPrompt(
  patterns: AllowedLibraryPattern[],
): string {
  const activePatterns = patterns.filter((p) => p.status === "active");

  if (activePatterns.length === 0) {
    return "";
  }

  const libraryList = activePatterns
    .map((p) => {
      const desc = p.description ? ` — ${p.description}` : "";
      return `- ${p.name}${desc}`;
    })
    .join("\n");

  return `## Authorized Libraries\n\nThe following libraries are available via CDN and may be used if they genuinely improve the game.\nOnly import what you actually use.\n\n${libraryList}\n\nUse only these libraries in your generated code. Include proper script tags for any external libraries you use.`;
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
