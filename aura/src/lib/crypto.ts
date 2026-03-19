import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.WORKFLOW_SECRET;
  if (!secret) throw new Error("WORKFLOW_SECRET environment variable is not set");

  // Require at least 32 hex chars (128 bits of entropy) to prevent weak keys
  const hexOnly = secret.replace(/[^0-9a-fA-F]/g, "");
  if (hexOnly.length < 32) {
    throw new Error(
      "WORKFLOW_SECRET is too short. Provide at least 32 hex characters (128 bits of entropy)."
    );
  }

  return Buffer.from(secret.padEnd(64, "0").slice(0, 64), "hex");
}

export function encryptWorkflowConfig(data: object): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptWorkflowConfig<T = object>(encryptedData: string): T {
  const key = getKey();
  const buffer = Buffer.from(encryptedData, "base64");
  if (buffer.length < 33) throw new Error("Encrypted payload is too short");
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
