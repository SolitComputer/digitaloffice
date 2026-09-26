import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type AttemptLimit = {
  key: string;
  maxFailures: number;
};

function limitsFor(email: string, ip: string): AttemptLimit[] {
  return [
    { key: `email:${email}`, maxFailures: 5 },
    { key: `ip:${ip}`, maxFailures: 50 },
  ];
}

export function getClientIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip") || "unknown";
}

export async function getLoginLockRemainingMs(email: string, ip: string): Promise<number> {
  const keys = limitsFor(email, ip).map((limit) => limit.key);
  const rows = await db
    .select({ lockedUntil: loginAttempts.lockedUntil })
    .from(loginAttempts)
    .where(inArray(loginAttempts.key, keys));

  const now = Date.now();
  return rows.reduce((longest, row) => {
    const remaining = row.lockedUntil ? row.lockedUntil.getTime() - now : 0;
    return Math.max(longest, remaining);
  }, 0);
}

export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  const now = new Date();

  for (const limit of limitsFor(email, ip)) {
    await db.transaction(async (tx) => {
      await tx
        .insert(loginAttempts)
        .values({ key: limit.key, failures: 0, windowStartedAt: now })
        .onDuplicateKeyUpdate({ set: { key: limit.key } });

      const [row] = await tx
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.key, limit.key))
        .for("update");
      if (!row) return;

      const isSameWindow = now.getTime() - row.windowStartedAt.getTime() < WINDOW_MS;
      const failures = isSameWindow ? row.failures + 1 : 1;

      await tx
        .update(loginAttempts)
        .set({
          failures,
          windowStartedAt: isSameWindow ? row.windowStartedAt : now,
          lockedUntil: failures >= limit.maxFailures ? new Date(now.getTime() + LOCK_MS) : null,
        })
        .where(eq(loginAttempts.key, limit.key));
    });
  }
}

export async function clearLoginFailures(email: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, `email:${email}`));
}