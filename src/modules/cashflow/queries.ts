import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cashflowCategories, cashflowEntries, type CashflowDirection } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export async function getCashflowSummary(ctx: TenantContext) {
  const [row] = await db
    .select({
      masuk: sql<number>`coalesce(sum(case when ${cashflowEntries.direction} = 'IN' then ${cashflowEntries.amount} else 0 end), 0)`.mapWith(Number),
      keluar: sql<number>`coalesce(sum(case when ${cashflowEntries.direction} = 'OUT' then ${cashflowEntries.amount} else 0 end), 0)`.mapWith(Number),
      countIn: sql<number>`sum(case when ${cashflowEntries.direction} = 'IN' then 1 else 0 end)`.mapWith(Number),
      countOut: sql<number>`sum(case when ${cashflowEntries.direction} = 'OUT' then 1 else 0 end)`.mapWith(Number),
    })
    .from(cashflowEntries)
    .where(eq(cashflowEntries.tenantId, ctx.tenantId));

  const masuk = row?.masuk ?? 0;
  const keluar = row?.keluar ?? 0;
  return { masuk, keluar, saldo: masuk - keluar, countIn: row?.countIn ?? 0, countOut: row?.countOut ?? 0 };
}

export type CashflowSummary = Awaited<ReturnType<typeof getCashflowSummary>>;

export async function listCashflowEntries(ctx: TenantContext, direction: CashflowDirection, limit = 100) {
  return db
    .select({
      id: cashflowEntries.id,
      direction: cashflowEntries.direction,
      method: cashflowEntries.method,
      amount: cashflowEntries.amount,
      date: cashflowEntries.date,
      note: cashflowEntries.note,
      createdAt: cashflowEntries.createdAt,
      categoryName: cashflowCategories.name,
    })
    .from(cashflowEntries)
    .leftJoin(cashflowCategories, eq(cashflowCategories.id, cashflowEntries.categoryId))
    .where(and(eq(cashflowEntries.tenantId, ctx.tenantId), eq(cashflowEntries.direction, direction)))
    .orderBy(desc(cashflowEntries.date), desc(cashflowEntries.createdAt))
    .limit(limit);
}

export type CashflowEntryRow = Awaited<ReturnType<typeof listCashflowEntries>>[number];