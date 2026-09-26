import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { tenantMembers, tenants, type TenantRole } from "@/db/schema";
import { requireSession } from "@/modules/auth/session";
import { resolvePermissions, type Permission } from "@/modules/tenants/permissions";

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  isSuspended: boolean;
  userId: string;
  role: TenantRole | "SUPER_ADMIN";
  permissions: ReadonlySet<Permission>;
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
    isSuspended: tenant.status !== "ACTIVE",
    userId: session.user.id,
  };

  if (session.user.isSuperAdmin) {
    return { ...base, role: "SUPER_ADMIN", permissions: resolvePermissions("SUPER_ADMIN", null) };
  }
  if (base.isSuspended) notFound();

  const [member] = await db
    .select({ role: tenantMembers.role, permissions: tenantMembers.permissions })
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenant.id), eq(tenantMembers.userId, session.user.id)))
    .limit(1);

  if (!member) redirect("/tanpa-akses");
  return {
    ...base,
    role: member.role,
    permissions: resolvePermissions(member.role, member.permissions),
  };
});
