import { allowedLibraryPatterns } from "@arcade-vibe/db/schema/library-patterns";

type AllowedLibraryPattern = typeof allowedLibraryPatterns.$inferSelect;

const SCRIPT_TAG_REGEX = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
const INLINE_SCRIPT_REGEX = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
/**
 * WARNING: Static pattern matching cannot catch all XSS attack vectors.
 * Sophisticated obfuscation techniques (encoding, splitting, dynamic construction)
 * may bypass these checks. This is a defense-in-depth measure, not a complete solution.
 * Always combine with Content Security Policy and proper sandboxing.
 */
const DANGEROUS_PATTERNS = [
  /\beval\s*\(/gi,
  /\bFunction\s*\(/gi,
  /\bnew\s+Function\s*\(/gi,
  /setTimeout\s*\(\s*["'`]/gi,
  /setInterval\s*\(\s*["'`]/gi,
  /\batob\s*\(/gi,
  /\bbtoa\s*\(/gi,
  /document\.write/gi,
  /\.innerHTML\s*=/gi,
  /\.outerHTML\s*=/gi,
  /document\.cookie/gi,
  /WebSocket\s*\(/gi,
  /import\s*\(/gi,
  /\[.*constructor.*constructor/gi,
];

export interface SanitizationResult {
  sanitizedHtml: string;
  blockedUrls: string[];
  blockedInlineScripts: number;
  allowedUrls: string[];
  dangerousPatternsFound: number;
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
  let dangerousPatternsFound = 0;

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

  const checkDangerousPatterns = (scriptContent: string): boolean => {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(scriptContent)) {
        return true;
      }
    }
    return false;
  };

  let sanitized = sanitizeScriptTags(html);

  sanitized = sanitized.replace(INLINE_SCRIPT_REGEX, (match, scriptContent) => {
    if (checkDangerousPatterns(scriptContent)) {
      dangerousPatternsFound++;
      return `<!-- BLOCKED INLINE SCRIPT: dangerous patterns detected (eval/Function) -->`;
    }
    return match;
  });

  return {
    sanitizedHtml: sanitized,
    blockedUrls,
    blockedInlineScripts,
    allowedUrls,
    dangerousPatternsFound,
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
