export interface EmbedCodeOptions {
  gameId: string;
  gameName?: string;
  width?: number | string;
  height?: number | string;
}

export function generateEmbedUrl(gameId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
  }
  return `${baseUrl}/embed/game/${gameId}`;
}

export function generateEmbedCode(options: EmbedCodeOptions): string {
  const { gameId, gameName, width = 800, height = 600 } = options;

  const embedUrl = generateEmbedUrl(gameId);
  const title = gameName ? `Play ${gameName} on Arcade Vibe` : "Play this game on Arcade Vibe";

  const widthAttr = typeof width === "number" ? width.toString() : width;
  const heightAttr = typeof height === "number" ? height.toString() : height;

  return `<iframe src="${embedUrl}" width="${widthAttr}" height="${heightAttr}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin" title="${title}"></iframe>`;
}
