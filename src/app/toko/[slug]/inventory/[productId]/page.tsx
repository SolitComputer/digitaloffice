import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Coins, Package, Tag } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/format";
import { FormTypeBadge } from "@/modules/inventory/categories/components/form-type-badge";
import { EditProductDialog } from "@/modules/inventory/components/edit-product-dialog";
import { ProductActiveButton } from "@/modules/inventory/components/product-active-button";
import { getProductDetail, listProductUnits, type ProductDetail } from "@/modules/inventory/queries";
import { UnitManager } from "@/modules/inventory/units/components/unit-manager";
import { AddUnitsButton } from "@/modules/inventory/units/components/add-units-button";
import { UNIT_STATUS_LABELS, UNIT_STATUS_VARIANTS } from "@/modules/inventory/unit-status";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts, hasPermission } from "@/modules/tenants/permissions";

export const metadata: Metadata = {
  title: "Detail Barang | DigitalOffice",
};

type ProductDetailPageProps = {
  params: Promise<{ slug: string; productId: string }>;
};

// Ringkasan spesifikasi sesuai tipe form.
function specRows(product: ProductDetail): { label: string; value: string }[] {
  if (product.formType === "laptop") {
    return [
      { label: "CPU", value: product.cpu ?? "—" },
      { label: "RAM", value: product.ram ?? "—" },
      { label: "Storage", value: product.storage ?? "—" },
      { label: "GPU", value: product.gpu ?? "—" },
      { label: "Display", value: product.display ?? "—" },
      { label: "Kondisi", value: product.condition ?? "—" },
    ];
  }
  return [{ label: "Spesifikasi", value: product.spec ?? "—" }];
}

function toEditValues(product: ProductDetail): Record<string, string> {
  return {
    name: product.name,
    brand: product.brand ?? "",
    cpu: product.cpu ?? "",
    ram: product.ram ?? "",
    storage: product.storage ?? "",
    gpu: product.gpu ?? "",
    display: product.display ?? "",
    condition: product.condition ?? "",
    spec: product.spec ?? "",
    costPrice: String(product.costPrice),
    sellPrice: String(product.sellPrice),
    note: product.note ?? "",
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, productId } = await params;
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "inventory.view")) notFound();
  if (!z.uuid().safeParse(productId).success) notFound();

  const [product, units] = await Promise.all([
    getProductDetail(tenant, productId),
    listProductUnits(tenant, productId),
  ]);
  if (!product) notFound();

  const canManage = canManageProducts(tenant);
  const inStock = units.filter((unit) => unit.soldAt === null).length;
  const inventoryPath = `/toko/${tenant.tenantSlug}/inventory`;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={inventoryPath}>
          <ArrowLeft className="size-4" />
          Data Barang
        </Link>
      </Button>

      <PageHeader
        title={product.name}
        description={`${product.categoryName}`}
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <EditProductDialog
                slug={tenant.tenantSlug}
                productId={product.id}
                formType={product.formType}
                values={toEditValues(product)}
              />
              <ProductActiveButton
                slug={tenant.tenantSlug}
                productId={product.id}
                name={product.name}
                isActive={product.isActive}
              />
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <FormTypeBadge formType={product.formType} />
        {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
        {product.isActive ? null : <Badge variant="secondary">Diarsipkan</Badge>}
      </div>

      <div className={canManage ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
        <StatCard index={0} label="Stok" value={`${formatNumber(inStock)} unit`} icon={<Package />} />
        <StatCard index={1} label="Harga Jual" value={formatRupiah(product.sellPrice)} icon={<Tag />} />
        {canManage ? (
          <StatCard index={2} label="Harga Modal" value={formatRupiah(product.costPrice)} icon={<Coins />} />
        ) : null}
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Spesifikasi</h2>
      <Card className="p-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          {specRows(product).map((row) => (
            <div key={row.label} className="space-y-1">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        {product.note ? <p className="mt-4 text-sm text-muted-foreground">{product.note}</p> : null}
      </Card>

      <div className="mt-8 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Kelola Unit ({units.length})</h2>
        {canManage ? <AddUnitsButton slug={tenant.tenantSlug} productId={product.id} /> : null}
      </div>
      {canManage ? (
        <UnitManager slug={tenant.tenantSlug} productId={product.id} units={units} />
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>SN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">SO</TableHead>
                  <TableHead className="text-center">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Belum ada unit.
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit, index) => (
                    <TableRow key={unit.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono">
                        {unit.serialNumber ?? <span className="text-muted-foreground">— belum diisi —</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={UNIT_STATUS_VARIANTS[unit.status]}>{UNIT_STATUS_LABELS[unit.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{unit.stockOpname ? "✓" : "—"}</TableCell>
                      <TableCell className="text-center">{unit.audited ? "✓" : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </>
  );
}