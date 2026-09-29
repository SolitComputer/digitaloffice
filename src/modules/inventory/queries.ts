import "server-only";
import { and, asc, count, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, productUnits } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export const PRODUCTS_PAGE_SIZE = 20;
export type ProductFilter = "semua" | "arsip";

type ListProductsParams = {
  query: string;
  page: number;
  filter: ProductFilter;
};

// Ekspresi hitung unit yang masih stok (belum terjual).
const inStock = sql`case when ${productUnits.soldAt} is null then 1 end`;

export async function listProducts(ctx: TenantContext, { query, page, filter }: ListProductsParams) {
  const where = and(
    eq(products.tenantId, ctx.tenantId),
    eq(products.isActive, filter !== "arsip"),
    query ? like(products.name, `%${query}%`) : undefined,
  );

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      categoryName: categories.name,
      formType: categories.formType,
      cpu: products.cpu,
      ram: products.ram,
      storage: products.storage,
      spec: products.spec,
      source: products.source,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      createdAt: products.createdAt,
      stock: sql<number>`count(${inStock})`.mapWith(Number),
      siapJual: sql<number>`sum(case when ${productUnits.status} = 'SIAP_JUAL' and ${productUnits.soldAt} is null then 1 else 0 end)`.mapWith(Number),
      minus: sql<number>`sum(case when ${productUnits.status} = 'MATOT' and ${productUnits.soldAt} is null then 1 else 0 end)`.mapWith(Number),
            sparepartTotal: sql<number>`sum(case when ${productUnits.soldAt} is null then ${productUnits.sparepartCost} else 0 end)`.mapWith(Number),
      costMin: sql<number>`min(case when ${productUnits.soldAt} is null then ${productUnits.costPrice} end)`.mapWith(Number),
      costMax: sql<number>`max(case when ${productUnits.soldAt} is null then ${productUnits.costPrice} end)`.mapWith(Number),
      setorMin: sql<number>`min(case when ${productUnits.soldAt} is null then ${productUnits.priceSetor} end)`.mapWith(Number),
      setorMax: sql<number>`max(case when ${productUnits.soldAt} is null then ${productUnits.priceSetor} end)`.mapWith(Number),
      setorSum: sql<number>`sum(case when ${productUnits.soldAt} is null then ${productUnits.priceSetor} else 0 end)`.mapWith(Number),
      grossSum: sql<number>`sum(case when ${productUnits.soldAt} is null then ${productUnits.priceSetor} - ${productUnits.costPrice} - ${productUnits.sparepartCost} else 0 end)`.mapWith(Number),
      soCount: sql<number>`sum(case when ${productUnits.soldAt} is null and ${productUnits.stockOpname} = true then 1 else 0 end)`.mapWith(Number),
      auditCount: sql<number>`sum(case when ${productUnits.soldAt} is null and ${productUnits.audited} = true then 1 else 0 end)`.mapWith(Number),
      snConcat: sql<string | null>`group_concat(case when ${productUnits.soldAt} is null and ${productUnits.serialNumber} is not null then ${productUnits.serialNumber} end)`,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(productUnits, eq(productUnits.productId, products.id))
    .where(where)
    .groupBy(products.id, categories.id)
    .orderBy(asc(products.name))
    .limit(PRODUCTS_PAGE_SIZE)
    .offset((page - 1) * PRODUCTS_PAGE_SIZE);

  const [total] = await db.select({ value: count() }).from(products).where(where);
  const totalCount = total?.value ?? 0;
  return {
    rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE)),
  };
}

export type ProductListRow = Awaited<ReturnType<typeof listProducts>>["rows"][number];

export async function getProductDetail(ctx: TenantContext, productId: string) {
  const [product] = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      categoryName: categories.name,
      formType: categories.formType,
      name: products.name,
      brand: products.brand,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      source: products.source,
      note: products.note,
      cpu: products.cpu,
      ram: products.ram,
      storage: products.storage,
      gpu: products.gpu,
      display: products.display,
      condition: products.condition,
      spec: products.spec,
      isActive: products.isActive,
      createdAt: products.createdAt,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.tenantId, ctx.tenantId), eq(products.id, productId)))
    .limit(1);

  return product ?? null;
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

export async function listProductUnits(ctx: TenantContext, productId: string) {
  return db
    .select({
      id: productUnits.id,
      serialNumber: productUnits.serialNumber,
      status: productUnits.status,
      grade: productUnits.grade,
      source: productUnits.source,
      enteredAt: productUnits.enteredAt,
      costPrice: productUnits.costPrice,
      sparepartCost: productUnits.sparepartCost,
      priceSetor: productUnits.priceSetor,
      priceOfficial: productUnits.priceOfficial,
      stockOpname: productUnits.stockOpname,
      audited: productUnits.audited,
      soldAt: productUnits.soldAt,
      createdAt: productUnits.createdAt,
    })
    .from(productUnits)
    .where(and(eq(productUnits.tenantId, ctx.tenantId), eq(productUnits.productId, productId)))
    .orderBy(asc(productUnits.createdAt));
}

export type ProductUnitRow = Awaited<ReturnType<typeof listProductUnits>>[number];

export async function getInventoryStats(ctx: TenantContext) {
  const base = and(eq(products.tenantId, ctx.tenantId), eq(products.isActive, true));

  const [[productCount], [unitStats]] = await Promise.all([
    db.select({ value: count() }).from(products).where(base),
    db
      .select({
        totalUnits: sql<number>`count(case when ${productUnits.soldAt} is null then 1 end)`.mapWith(Number),
        minusUnits: sql<number>`sum(case when ${productUnits.status} = 'MATOT' and ${productUnits.soldAt} is null then 1 else 0 end)`.mapWith(Number),
      })
      .from(productUnits)
      .innerJoin(products, eq(products.id, productUnits.productId))
      .where(base),
  ]);

  return {
    totalProducts: productCount?.value ?? 0,
    totalUnits: unitStats?.totalUnits ?? 0,
    minusUnits: unitStats?.minusUnits ?? 0,
  };
}


export async function getInventorySummary(
  ctx: TenantContext,
  { query, filter }: { query: string; filter: ProductFilter },
) {
  const where = and(
    eq(products.tenantId, ctx.tenantId),
    eq(products.isActive, filter !== "arsip"),
    query ? like(products.name, `%${query}%`) : undefined,
  );

  const [row] = await db
    .select({
      products: sql<number>`count(distinct ${products.id})`.mapWith(Number),
      units: sql<number>`sum(case when ${productUnits.soldAt} is null then 1 else 0 end)`.mapWith(Number),
      modal: sql<number>`sum(case when ${productUnits.soldAt} is null then ${productUnits.costPrice} + ${productUnits.sparepartCost} else 0 end)`.mapWith(Number),
      profit: sql<number>`sum(case when ${productUnits.soldAt} is null then ${productUnits.priceSetor} - ${productUnits.costPrice} - ${productUnits.sparepartCost} else 0 end)`.mapWith(Number),
    })
    .from(products)
    .leftJoin(productUnits, eq(productUnits.productId, products.id))
    .where(where);

  return {
    products: row?.products ?? 0,
    units: row?.units ?? 0,
    modal: row?.modal ?? 0,
    profit: row?.profit ?? 0,
  };
}