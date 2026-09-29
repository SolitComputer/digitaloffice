import "server-only";
import { and, asc, count, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { tenantMembers, tenants, users, type TenantRole } from "@/db/schema";

export const TENANTS_PAGE_SIZE = 20;

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

type ListTenantsParams = {
  query: string;
  page: number;
};

export async function listTenants({ query, page }: ListTenantsParams) {
  const search = query
    ? or(like(tenants.name, `%${query}%`), like(tenants.slug, `%${query}%`))
    : undefined;

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        status: tenants.status,
        createdAt: tenants.createdAt,
        memberCount: count(tenantMembers.userId),
      })
      .from(tenants)
      .leftJoin(tenantMembers, eq(tenantMembers.tenantId, tenants.id))
      .where(search)
      .groupBy(tenants.id)
      .orderBy(desc(tenants.createdAt))
      .limit(TENANTS_PAGE_SIZE)
      .offset((page - 1) * TENANTS_PAGE_SIZE),
    db.select({ value: count() }).from(tenants).where(search),
  ]);

  const totalCount = total?.value ?? 0;
  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / TENANTS_PAGE_SIZE)),
  };
}


export const PLATFORM_MEMBERS_PAGE_SIZE = 20;

type ListPlatformMembersParams = {
  query: string;
  tenantId: string;
  role: TenantRole | "";
  page: number;
};

export async function listPlatformMembers({ query, tenantId, role, page }: ListPlatformMembersParams) {
  const where = and(
    query ? or(like(users.name, `%${query}%`), like(users.email, `%${query}%`)) : undefined,
    tenantId ? eq(tenantMembers.tenantId, tenantId) : undefined,
    role ? eq(tenantMembers.role, role) : undefined,
  );

  const [rows, [total]] = await Promise.all([
    db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        tenantStatus: tenants.status,
        role: tenantMembers.role,
        permissions: tenantMembers.permissions,
      })
      .from(tenantMembers)
      .innerJoin(users, eq(users.id, tenantMembers.userId))
      .innerJoin(tenants, eq(tenants.id, tenantMembers.tenantId))
      .where(where)
      .orderBy(asc(tenants.name), asc(users.name))
      .limit(PLATFORM_MEMBERS_PAGE_SIZE)
      .offset((page - 1) * PLATFORM_MEMBERS_PAGE_SIZE),
    db
      .select({ value: count() })
      .from(tenantMembers)
      .innerJoin(users, eq(users.id, tenantMembers.userId))
      .where(where),
  ]);

  const totalCount = total?.value ?? 0;
  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PLATFORM_MEMBERS_PAGE_SIZE)),
  };
}

export async function listTenantOptions() {
  return db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .orderBy(asc(tenants.name));
}