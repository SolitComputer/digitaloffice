import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Coins, Package, Tag } from "lucide-react";
import { z } from "zod";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { formatNumber, formatRupiah } from "@/lib/format";
import { buildHref, readParam } from "@/lib/search-params";
import { EditProductDialog } from "@/modules/inventory/components/edit-product-dialog";
import { ProductActiveButton } from "@/modules/inventory/components/product-active-button";
import { StockMovementDialog } from "@/modules/inventory/components/stock-movement-dialog";
import { StockMovementTable } from "@/modules/inventory/components/stock-movement-table";
import { getProductDetail, listStockMovements, type ProductDetail } from "@/modules/inventory/queries";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts, getAllowedMovementTypes, hasPermission } from "@/modules/tenants/permissions";

export const metadata: Metadata = {
  title: "Detail Produk | DigitalOffice",
};

type ProductDetailPageProps = {
  params: Promise<{ slug: string; productId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function describeStock(product: ProductDetail): string {
  if (product.minStock === 0) return "Batas minimum tidak dipantau";
  const minimum = `${formatNumber(product.minStock)} ${product.unit}`;
  return product.stock <= product.minStock ? `Menipis, batas minimum ${minimum}` : `Batas minimum ${minimum}`;
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const [{ slug, productId }, query] = await Promise.all([params, searchParams]);
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "inventory.view")) notFound();
  if (!z.uuid().safeParse(productId).success) notFound();

  const page = Math.max(1, Number.parseInt(readParam(query.page), 10) || 1);
  const [product, movements] = await Promise.all([
    getProductDetail(tenant, productId),
    listStockMovements(tenant, productId, page),
  ]);
  if (!product) notFound();

  const canManage = canManageProducts(tenant);
  const allowedTypes = getAllowedMovementTypes(tenant);
  const inventoryPath = `/toko/${tenant.tenantSlug}/inventory`;
  const basePath = `${inventoryPath}/${product.id}`;
  const pageHref = (target: number) => buildHref(basePath, { page: target > 1 ? target : undefined });

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={inventoryPath}>
          <ArrowLeft className="size-4" />
          Inventory
        </Link>
      </Button>

      <PageHeader
        title={product.name}
        description={`${product.sku ?? "Tanpa SKU"} · Satuan ${product.unit}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {product.isActive && allowedTypes.length > 0 ? (
              <StockMovementDialog
                slug={tenant.tenantSlug}
                product={{ id: product.id, name: product.name, unit: product.unit, stock: product.stock }}
                allowedTypes={allowedTypes}
              />
            ) : null}
            {canManage ? (
              <>
                <EditProductDialog
                  slug={tenant.tenantSlug}
                  productId={product.id}
                  values={{
                    name: product.name,
                    sku: product.sku ?? "",
                    unit: product.unit,
                    costPrice: String(product.costPrice),
                    sellPrice: String(product.sellPrice),
                    minStock: String(product.minStock),
                  }}
                />
                <ProductActiveButton
                  slug={tenant.tenantSlug}
                  productId={product.id}
                  name={product.name}
                  isActive={product.isActive}
                />
              </>
            ) : null}
          </div>
        }
      />

      {product.isActive ? null : (
        <div role="status" className="mb-4 rounded-md border px-4 py-3 text-sm text-muted-foreground">
          Produk ini diarsipkan. Aktifkan kembali untuk mencatat stok.
        </div>
      )}

      <div className={canManage ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
        <StatCard
          index={0}
          label="Stok"
          value={`${formatNumber(product.stock)} ${product.unit}`}
          hint={describeStock(product)}
          icon={<Package />}
        />
        <StatCard index={1} label="Harga Jual" value={formatRupiah(product.sellPrice)} icon={<Tag />} />
        {canManage ? (
          <StatCard index={2} label="Harga Modal" value={formatRupiah(product.costPrice)} icon={<Coins />} />
        ) : null}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Riwayat Stok</h2>
      <StockMovementTable rows={movements.rows} unit={product.unit} />
      <ListPagination
        page={page}
        totalPages={movements.totalPages}
        prevHref={page > 1 ? pageHref(page - 1) : undefined}
        nextHref={page < movements.totalPages ? pageHref(page + 1) : undefined}
      />
    </>
  );
}
