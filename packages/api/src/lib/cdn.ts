import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Create S3 client once for reuse
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
  gameCode: string,
  gameId: string,
): Promise<string> => {
  const cdnUrl = process.env.CDN_URL;
  const cdnAccessKeyId = process.env.CDN_ACCESS_KEY_ID;
  const cdnSecretAccessKey = process.env.CDN_SECRET_ACCESS_KEY;
  const bucket = process.env.CDN_BUCKET || "games";

  if (!cdnUrl || !cdnAccessKeyId || !cdnSecretAccessKey) {
    throw new Error("CDN configuration is missing");
  }

  const s3Client = getS3Client();
  const key = `${gameId}/index.html`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: gameCode,
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
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadToCDNInternal(gameCode, gameId);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        // Exponential backoff: 2^attempt * 1000ms
        const backoffDelay = 2 ** attempt * 1000;
        await sleep(backoffDelay);
      }
    }
  }

  throw new Error(
    `CDN upload failed after ${maxAttempts} attempts: ${lastError?.message}`,
  );
};
