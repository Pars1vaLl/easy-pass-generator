import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { redis } from "@/lib/redis";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

/**
 * Return a signed URL for an R2 object.
 * Results are cached in Redis for (expiresInSeconds - 60) seconds so
 * we never return a URL that's about to expire. The key may be a full
 * signed URL already (returned by some providers) — if it starts with
 * "https://" and doesn't look like an R2 key, it's returned as-is.
 */
export async function signUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  // Already a full URL (e.g. provider-returned URL not yet migrated to R2)
  if (key.startsWith("https://") || key.startsWith("http://")) {
    return key;
  }

  const cacheKey = `signed_url:${key}:${expiresInSeconds}`;
  const ttl = expiresInSeconds - 60; // cache slightly less than expiry

  try {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached;
  } catch {
    // Redis unavailable — skip cache
  }

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });

  try {
    if (ttl > 0) {
      await redis.set(cacheKey, url, { ex: ttl });
    }
  } catch {
    // Redis write failed — still return the signed URL
  }

  return url;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export function generateMediaKey(
  userId: string,
  generationId: string,
  filename: string
): string {
  return `generations/${userId}/${generationId}/${filename}`;
}
