import { createHighlighter } from "shiki";

let highlighterInstance: Awaited<ReturnType<typeof createHighlighter>> | null =
  null;

const initializeHighlighter = async () => {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ["github-dark"],
      langs: ["html", "javascript", "css"],
    });
  }
  return highlighterInstance;
};

export const highlightCode = async (
  code: string,
  lang: string
): Promise<string> => {
  const highlighter = await initializeHighlighter();

  // Default to html if language not supported
  const supportedLang = ["html", "javascript", "css"].includes(lang)
    ? lang
    : "html";

  const highlighted = highlighter.codeToHtml(code, {
    lang: supportedLang,
    theme: "github-dark",
  });

  return highlighted;
};
