import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantMembers, users } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export async function listMembers(ctx: TenantContext) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: tenantMembers.role,
      joinedAt: tenantMembers.createdAt,
    })
    .from(tenantMembers)
    .innerJoin(users, eq(users.id, tenantMembers.userId))
    .where(eq(tenantMembers.tenantId, ctx.tenantId))
    .orderBy(asc(users.name));
}