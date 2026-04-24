import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

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

export const processImageForThumbnail = async (
  imageBuffer: Buffer,
): Promise<Buffer> => {
  const processed = await sharp(imageBuffer)
    .resize(800, null, { withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
  return Buffer.from(processed);
};

const uploadImageToLocalFilesystem = async (
  buffer: Buffer,
  key: string,
): Promise<string> => {
  const filename = key.replace("thumbnails/", "");
  const dir = join(process.cwd(), "public", "thumbnails");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/api/thumbnails/${filename}`;
};

const uploadImageToCDNInternal = async (
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> => {
  const cdnUrl = process.env.CDN_URL;
  const bucket = process.env.CDN_BUCKET || "games";

  const s3Client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);

  const assetUrl = `${cdnUrl}/${key}`;
  return assetUrl;
};

export const uploadImage = async ({
  buffer,
  key,
  contentType,
}: {
  buffer: Buffer;
  key: string;
  contentType: string;
}): Promise<string> => {
  if (!isCDNConfigured()) {
    return uploadImageToLocalFilesystem(buffer, key);
  }

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadImageToCDNInternal(buffer, key, contentType);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const backoffDelay = 2 ** attempt * 1000;
        await sleep(backoffDelay);
      }
    }
  }

  throw new Error(
    `Image upload failed after ${maxAttempts} attempts: ${lastError?.message}`,
  );
};
