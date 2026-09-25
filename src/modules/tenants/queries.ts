import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantMembers, tenants, users } from "@/db/schema";

export async function getActiveMemberships(userId: string) {
  return db
    .select({
      slug: tenants.slug,
      name: tenants.name,
      role: tenantMembers.role,
    })
    .from(tenantMembers)
    .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
    .where(and(eq(tenantMembers.userId, userId), eq(tenants.status, "ACTIVE")))
    .orderBy(asc(tenants.name));
}

export async function resolveHomePath(userId: string): Promise<string> {
  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.isSuperAdmin) return "/admin";

  const [firstMembership] = await getActiveMemberships(userId);
  return firstMembership ? `/toko/${firstMembership.slug}` : "/tanpa-akses";
}