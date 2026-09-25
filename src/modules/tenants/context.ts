import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tenantMembers, tenants, type TenantRole } from "@/db/schema";
import { requireSession } from "@/modules/auth/session";

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  userId: string;
  role: TenantRole | "SUPER_ADMIN";
};

export const requireTenant = cache(async (slug: string): Promise<TenantContext> => {
  const session = await requireSession();

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) notFound();

  const base = {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    userId: session.user.id,
  };

  if (session.user.isSuperAdmin) return { ...base, role: "SUPER_ADMIN" };
  if (tenant.status !== "ACTIVE") notFound();

  const [member] = await db
    .select({ role: tenantMembers.role })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenant.id), eq(tenantMembers.userId, session.user.id)))
    .limit(1);

  if (!member) notFound();
  return { ...base, role: member.role };
});