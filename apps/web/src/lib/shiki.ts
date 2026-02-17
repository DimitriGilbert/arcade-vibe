import { createHighlighter } from "shiki";

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null = null;
let highlighterPromise: Promise<Awaited<ReturnType<typeof createHighlighter>>> | null = null;

export interface CodeHighlightOptions {
  code: string;
  lang: string;
  theme: "github-dark" | "github-light";
}

/**
 * Initialize Shiki highlighter with required themes and languages.
 * This should be called once at application startup.
 */
export async function initShiki() {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ["github-dark", "github-light"],
    langs: [
      "typescript",
      "javascript",
      "tsx",
      "jsx",
      "python",
      "rust",
      "go",
      "java",
      "c",
      "cpp",
      "bash",
      "shell",
      "json",
      "yaml",
      "toml",
      "markdown",
      "css",
      "html",
      "sql",
      "prisma",
    ],
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Get the highlighter instance, initializing if necessary.
 */
export async function getHighlighter() {
  if (!highlighterInstance) {
    await initShiki();
  }
  return highlighterInstance!;
}

/**
 * Highlight code with specified language and theme.
 */
export async function highlightCode({ code, lang, theme }: CodeHighlightOptions) {
  const highlighter = await getHighlighter();

  try {
    const html = highlighter.codeToHtml(code, {
      lang,
      theme,
    });
    return html;
  } catch (error) {
    // If language not supported, fall back to plaintext
    console.warn(`Language ${lang} not supported, falling back to plaintext`, error);
    return highlighter.codeToHtml(code, {
      lang: "plaintext",
      theme,
    });
  }
}

/**
 * Check if Shiki is initialized.
 */
export function isShikiInitialized() {
  return highlighterInstance !== null;
}
