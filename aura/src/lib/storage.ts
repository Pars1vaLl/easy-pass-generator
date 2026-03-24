// Local mock storage implementation for development
// Stores files in memory for demo purposes

const localStorage = new Map<string, { data: Buffer; contentType: string }>();

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  // Store in local memory
  localStorage.set(key, { data: body, contentType });
  console.log(`[Mock Storage] Uploaded: ${key}`);
  return key;
}

/**
 * Return a mock signed URL for local development.
 * In production, this would return a signed URL from R2.
 */
export async function signUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  // Already a full URL - return as-is
  if (key.startsWith("https://") || key.startsWith("http://")) {
    return key;
  }

  // For local development, return a data URL or mock URL
  const stored = localStorage.get(key);
  if (stored) {
    // Return a placeholder image URL for local development
    return `https://picsum.photos/seed/${encodeURIComponent(key)}/800/600`;
  }

  return `https://picsum.photos/seed/${encodeURIComponent(key)}/800/600`;
}

export async function deleteFromR2(key: string): Promise<void> {
  localStorage.delete(key);
  console.log(`[Mock Storage] Deleted: ${key}`);
}

export function generateMediaKey(
  userId: string,
  generationId: string,
  filename: string
): string {
  return `generations/${userId}/${generationId}/${filename}`;
}

// Helper to get stored data (for debugging)
export function getStoredData(key: string) {
  return localStorage.get(key);
}
