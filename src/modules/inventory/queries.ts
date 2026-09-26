import "server-only";
import { and, asc, count, desc, eq, gt, like, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { products, stockMovements, users } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export const PRODUCTS_PAGE_SIZE = 20;
export const MOVEMENTS_PAGE_SIZE = 20;

export type ProductFilter = "semua" | "menipis" | "arsip";

type ListProductsParams = {
  query: string;
  page: number;
  filter: ProductFilter;
};

function lowStockCondition() {
  return and(gt(products.minStock, 0), lte(products.stock, products.minStock));
}

export async function listProducts(ctx: TenantContext, { query, page, filter }: ListProductsParams) {
  const where = and(
    eq(products.tenantId, ctx.tenantId),
    eq(products.isActive, filter !== "arsip"),
    query ? or(like(products.name, `%${query}%`), like(products.sku, `%${query}%`)) : undefined,
    filter === "menipis" ? lowStockCondition() : undefined,
  );

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        unit: products.unit,
        sellPrice: products.sellPrice,
        stock: products.stock,
        minStock: products.minStock,
      })
      .from(products)
      .where(where)
      .orderBy(asc(products.name))
      .limit(PRODUCTS_PAGE_SIZE)
      .offset((page - 1) * PRODUCTS_PAGE_SIZE),
    db.select({ value: count() }).from(products).where(where),
  ]);

  const totalCount = total?.value ?? 0;
  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE)),
  };
}

export async function getInventoryStats(ctx: TenantContext) {
  const base = and(eq(products.tenantId, ctx.tenantId), eq(products.isActive, true));

  const [[total], [lowStock]] = await Promise.all([
    db.select({ value: count() }).from(products).where(base),
    db.select({ value: count() }).from(products).where(and(base, lowStockCondition())),
  ]);

  return {
    totalProducts: total?.value ?? 0,
    lowStock: lowStock?.value ?? 0,
  };
}

export async function getProductDetail(ctx: TenantContext, productId: string) {
  const [product] = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      unit: products.unit,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      stock: products.stock,
      minStock: products.minStock,
      isActive: products.isActive,
    })
    .from(products)
    .where(and(eq(products.tenantId, ctx.tenantId), eq(products.id, productId)))
    .limit(1);

  return product ?? null;
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

export async function listStockMovements(ctx: TenantContext, productId: string, page: number) {
  const where = and(eq(stockMovements.tenantId, ctx.tenantId), eq(stockMovements.productId, productId));

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantityChange: stockMovements.quantityChange,
        stockAfter: stockMovements.stockAfter,
        note: stockMovements.note,
        createdAt: stockMovements.createdAt,
        createdByName: users.name,
      })
      .from(stockMovements)
      .innerJoin(users, eq(users.id, stockMovements.createdBy))
      .where(where)
      .orderBy(desc(stockMovements.createdAt))
      .limit(MOVEMENTS_PAGE_SIZE)
      .offset((page - 1) * MOVEMENTS_PAGE_SIZE),
    db.select({ value: count() }).from(stockMovements).where(where),
  ]);

  const totalCount = total?.value ?? 0;
  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / MOVEMENTS_PAGE_SIZE)),
  };
}

export type StockMovementRow = Awaited<ReturnType<typeof listStockMovements>>["rows"][number];
