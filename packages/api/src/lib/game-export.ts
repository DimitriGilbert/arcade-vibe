const STUB_SDK = `
(function() {
  "use strict";
  let sessionStart = null;

  function getPlaytime() {
    if (sessionStart === null) return 0;
    return Math.floor((Date.now() - sessionStart) / 1000);
  }

  window.ArcadeVibe = {
    startGame() {
      if (sessionStart !== null) return;
      sessionStart = Date.now();
    },

    reportScore(score) {
      if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
        console.warn("[ArcadeVibe Portable] Invalid score. Must be a positive integer.");
        return;
      }
      if (sessionStart === null) {
        sessionStart = Date.now();
      }
      console.log("[ArcadeVibe Portable] Score recorded:", score);
    },

    getPlaytime() {
      return getPlaytime();
    },

    isReady() {
      return true;
    }
  };
})();
`;

const BACKLINK_STYLES = `
.arcade-vibe-backlink {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 999999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.arcade-vibe-backlink:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}
.arcade-vibe-backlink svg {
  width: 18px;
  height: 18px;
}
`;

const BACKLINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;

export interface PortableGameData {
  id: string;
  name: string | null;
  gameData: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function generatePortableFilename(game: PortableGameData): string {
  const baseName = game.name ? slugify(game.name) : game.id.slice(0, 8);
  return `arcade-vibe_${baseName}.html`;
}

export function generatePortableGameHtml(
  game: PortableGameData,
  baseUrl: string,
): string {
  const gameUrl = `${baseUrl}/game/${game.id}`;
  const gameTitle = game.name || "Untitled Game";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(gameTitle)} - Arcade Vibe</title>
    <meta name="generator" content="Arcade Vibe Portable Export" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; }
      ${BACKLINK_STYLES}
    </style>
    <script>
      ${STUB_SDK}
    </script>
  </head>
  <body>
    <a href="${escapeHtml(gameUrl)}" target="_blank" rel="noopener noreferrer" class="arcade-vibe-backlink">
      ${BACKLINK_ICON}
      Play on Arcade Vibe
    </a>
    ${game.gameData}
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
