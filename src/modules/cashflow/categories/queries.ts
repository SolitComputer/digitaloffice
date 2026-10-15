import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cashflowCategories, type CashflowDirection } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export async function listCashflowCategories(ctx: TenantContext) {
  return db
    .select({
      id: cashflowCategories.id,
      name: cashflowCategories.name,
      type: cashflowCategories.type,
      isActive: cashflowCategories.isActive,
    })
    .from(cashflowCategories)
    .where(eq(cashflowCategories.tenantId, ctx.tenantId))
    .orderBy(asc(cashflowCategories.name));
}

export type CashflowCategoryRow = Awaited<ReturnType<typeof listCashflowCategories>>[number];

// Kategori aktif untuk dropdown form, difilter sesuai arah (IN/OUT).
export async function listActiveCategoriesFor(ctx: TenantContext, direction: CashflowDirection) {
  const rows = await db
    .select({ id: cashflowCategories.id, name: cashflowCategories.name, type: cashflowCategories.type })
    .from(cashflowCategories)
    .where(and(eq(cashflowCategories.tenantId, ctx.tenantId), eq(cashflowCategories.isActive, true)))
    .orderBy(asc(cashflowCategories.name));
  return rows.filter((r) => r.type === "BOTH" || r.type === direction);
}