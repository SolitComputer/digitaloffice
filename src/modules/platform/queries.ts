import "server-only";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";

export async function getPlatformStats() {
  const [[tenantTotal], [tenantActive], [userTotal]] = await Promise.all([
    db.select({ value: count() }).from(tenants),
    db.select({ value: count() }).from(tenants).where(eq(tenants.status, "ACTIVE")),
    db.select({ value: count() }).from(users),
  ]);

  return {
    tenants: tenantTotal?.value ?? 0,
    activeTenants: tenantActive?.value ?? 0,
    users: userTotal?.value ?? 0,
  };
}