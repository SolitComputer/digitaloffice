import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

/** Untuk halaman Master Kategori — termasuk jumlah produk yang memakainya. */
export async function listCategories(ctx: TenantContext) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      formType: categories.formType,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.tenantId, ctx.tenantId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
}

export type CategoryRow = Awaited<ReturnType<typeof listCategories>>[number];

/** Untuk dropdown "Tambah Barang" — hanya kategori aktif. */
export async function listActiveCategories(ctx: TenantContext) {
  return db
    .select({ id: categories.id, name: categories.name, formType: categories.formType })
    .from(categories)
    .where(and(eq(categories.tenantId, ctx.tenantId), eq(categories.isActive, true)))
    .orderBy(asc(categories.name));
}

export type CategoryOption = Awaited<ReturnType<typeof listActiveCategories>>[number];