const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const uploadToCDNInternal = async (
  gameCode: string,
  gameId: string
): Promise<string> => {
  const cdnUrl = process.env.CDN_URL;
  const cdnAccessKeyId = process.env.CDN_ACCESS_KEY_ID;
  const cdnSecretAccessKey = process.env.CDN_SECRET_ACCESS_KEY;

  if (!cdnUrl || !cdnAccessKeyId || !cdnSecretAccessKey) {
    throw new Error("CDN configuration is missing");
  }

  // For now, we'll return a placeholder URL
  // In production, this would upload to Cloudflare R2 or S3-compatible storage
  // The gameCode would be uploaded as ${gameId}/index.html
  console.log(`[CDN] Would upload ${gameCode.length} bytes to ${gameId}/index.html`);
  const assetUrl = `${cdnUrl}/games/${gameId}/index.html`;

  // TODO: Implement actual upload to CDN
  // Example using AWS S3 SDK:
  // const s3 = new S3Client({
  //   region: 'auto',
  //   endpoint: cdnUrl,
  //   credentials: {
  //     accessKeyId: cdnAccessKeyId,
  //     secretAccessKey: cdnSecretAccessKey,
  //   },
  // });

  // await s3.send(new PutObjectCommand({
  //   Bucket: 'games',
  //   Key: `${gameId}/index.html`,
  //   Body: gameCode,
  //   ContentType: 'text/html',
  // }));

  return assetUrl;
};

export const uploadToCDN = async (
  gameCode: string,
  gameId: string
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
    `CDN upload failed after ${maxAttempts} attempts: ${lastError?.message}`
  );
};
