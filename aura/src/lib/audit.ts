import { db } from "./db";

export async function auditLog(
  userId: string | null,
  action: string,
  metadata?: object,
  ip?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata ?? {},
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
