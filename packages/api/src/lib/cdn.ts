import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isCDNConfigured = (): boolean => {
  return !!(
    process.env.CDN_URL &&
    process.env.CDN_ACCESS_KEY_ID &&
    process.env.CDN_SECRET_ACCESS_KEY
  );
};

const uploadToLocalFilesystem = async (
  gameCode: string,
  gameId: string,
): Promise<string> => {
  const gamesDir = join(process.cwd(), "public", "games", gameId);
  await mkdir(gamesDir, { recursive: true });
  await writeFile(join(gamesDir, "index.html"), gameCode, "utf-8");
  return `/games/${gameId}/index.html`;
};

const getS3Client = (): S3Client => {
  const region = process.env.CDN_REGION || "auto";
  const endpoint = process.env.CDN_URL;

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.CDN_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CDN_SECRET_ACCESS_KEY!,
    },
  });
};

const uploadToCDNInternal = async (
  gameCodeBytes: Uint8Array,
  gameId: string,
): Promise<string> => {
  const cdnUrl = process.env.CDN_URL;
  const bucket = process.env.CDN_BUCKET || "games";

  const s3Client = getS3Client();
  const key = `${gameId}/index.html`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: gameCodeBytes,
    ContentType: "text/html",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);

  const assetUrl = `${cdnUrl}/${key}`;
  return assetUrl;
};

export const uploadToCDN = async (
  gameCode: string,
  gameId: string,
): Promise<string> => {
  if (!isCDNConfigured()) {
    return uploadToLocalFilesystem(gameCode, gameId);
  }

  // Encode once and reuse across retries to avoid repeated large string->byte allocations.
  const gameCodeBytes = new TextEncoder().encode(gameCode);

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadToCDNInternal(gameCodeBytes, gameId);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const backoffDelay = 2 ** attempt * 1000;
        await sleep(backoffDelay);
      }
    }
  }

  throw new Error(
    `CDN upload failed after ${maxAttempts} attempts: ${lastError?.message}`,
  );
};
