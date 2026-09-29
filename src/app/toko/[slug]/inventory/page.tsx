import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, Package, Tag, TrendingUp, Wallet } from "lucide-react";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { buildHref, readParam } from "@/lib/search-params";
import { FormTypeBadge } from "@/modules/inventory/categories/components/form-type-badge";
import { listActiveCategories } from "@/modules/inventory/categories/queries";
import { CreateProductDialog } from "@/modules/inventory/components/create-product-dialog";
import { getInventorySummary, listProducts, type ProductFilter } from "@/modules/inventory/queries";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts, hasPermission } from "@/modules/tenants/permissions";

export const metadata: Metadata = {
  title: "Data Barang | DigitalOffice",
};

type InventoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "semua", label: "Aktif" },
  { value: "arsip", label: "Diarsipkan" },
];

function readFilter(value: string): ProductFilter {
  return value === "arsip" ? "arsip" : "semua";
}

function rangeRupiah(min: number, max: number, stock: number): string {
  if (stock === 0) return "—";
  return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

function text(value: string | null): string {
  return value && value.trim() ? value : "—";
}

function snLabel(stock: number, snConcat: string | null): string {
  if (stock === 0) return "—";
  if (stock === 1) return snConcat?.split(",").find(Boolean) ?? "—";
  return `${formatNumber(stock)} SN`;
}

// Header sel: rapi & konsisten
const TH = "h-11 whitespace-nowrap text-xs font-medium uppercase tracking-wider text-muted-foreground";
const THR = `${TH} text-right`;

export default async function InventoryPage({ params, searchParams }: InventoryPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "inventory.view")) notFound();

  const search = readParam(query.q).trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(readParam(query.page), 10) || 1);
  const filter = readFilter(readParam(query.filter));
  const canManage = canManageProducts(tenant);

  const [categories, summary, { rows, totalCount, totalPages }] = await Promise.all([
    canManage ? listActiveCategories(tenant) : Promise.resolve([]),
    getInventorySummary(tenant, { query: search, filter }),
    listProducts(tenant, { query: search, page, filter }),
  ]);

  const basePath = `/toko/${tenant.tenantSlug}/inventory`;
  const noCategory = canManage && categories.length === 0;
  const colCount = canManage ? 22 : 21;
  const hrefFor = (overrides: { page?: number; filter?: ProductFilter }) =>
    buildHref(basePath, {
      q: search,
      filter: (overrides.filter ?? filter) === "semua" ? undefined : (overrides.filter ?? filter),
      page: overrides.page && overrides.page > 1 ? overrides.page : undefined,
    });

  return (
    <>
      <PageHeader
        title="Data Barang"
        description="Kelola stok, harga, dan unit barang toko."
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`${basePath}/kategori`}>
                  <Tag className="size-4" />
                  Master Kategori
                </Link>
              </Button>
              {noCategory ? null : <CreateProductDialog slug={tenant.tenantSlug} categories={categories} />}
            </div>
          ) : undefined
        }
      />

      {/* Ringkasan */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Total Barang" value={formatNumber(summary.products)} hint={`${filter === "arsip" ? "diarsipkan" : "aktif"}`} icon={<Package />} />
        <StatCard index={1} label="Unit Stok" value={formatNumber(summary.units)} hint="unit belum terjual" icon={<Boxes />} />
        <StatCard index={2} label="Nilai Modal Stok" value={formatRupiah(summary.modal)} hint="modal + sparepart" icon={<Wallet />} />
        <StatCard index={3} label="Potensi Profit" value={formatRupiah(summary.profit)} hint="jika semua terjual" icon={<TrendingUp />} />
      </div>

      {noCategory ? (
        <div role="status" className="mb-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Belum ada kategori. Buat kategori dulu di{" "}
          <Link className="font-medium underline" href={`${basePath}/kategori`}>
            Master Kategori
          </Link>{" "}
          sebelum menambah barang.
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex w-full max-w-md gap-2">
          <Input name="q" defaultValue={search} placeholder="Cari nama barang..." />
          {filter !== "semua" ? <input type="hidden" name="filter" value={filter} /> : null}
          <Button type="submit" variant="outline">Cari</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Button key={item.value} asChild size="sm" variant={filter === item.value ? "default" : "outline"}>
              <Link href={hrefFor({ filter: item.value, page: 1 })}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className={`${THR} sticky left-0 z-20 w-12 bg-muted`}>No</TableHead>
                <TableHead className={`${TH} sticky left-12 z-20 min-w-48 border-r bg-muted`}>Nama Barang</TableHead>
                <TableHead className={TH}>Kategori</TableHead>
                <TableHead className={TH}>Merk</TableHead>
                <TableHead className={TH}>CPU</TableHead>
                <TableHead className={TH}>RAM</TableHead>
                <TableHead className={TH}>Storage</TableHead>
                <TableHead className={TH}>Spek</TableHead>
                <TableHead className={THR}>Harga Modal</TableHead>
                <TableHead className={THR}>Modal Sparepart</TableHead>
                <TableHead className={THR}>Harga Jual</TableHead>
                <TableHead className={THR}>Total Jual</TableHead>
                <TableHead className={THR}>Gross Profit</TableHead>
                <TableHead className={TH}>Sumber</TableHead>
                <TableHead className={TH}>Tgl Masuk</TableHead>
                <TableHead className={TH}>SN</TableHead>
                <TableHead className={THR}>Stok</TableHead>
                <TableHead className={THR}>SJ</TableHead>
                <TableHead className={THR}>M</TableHead>
                <TableHead className={THR}>SO</TableHead>
                <TableHead className={THR}>Audit</TableHead>
                {canManage ? <TableHead className={THR}>Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-16 text-center text-muted-foreground">
                    {search ? "Tidak ada barang yang cocok." : "Belum ada barang."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((product, index) => {
                  const rowNumber = (page - 1) * rows.length + index + 1;
                  const modalRange = rangeRupiah(product.costMin, product.costMax, product.stock);
                  const jualRange = rangeRupiah(product.setorMin, product.setorMax, product.stock);

                  return (
                    <TableRow key={product.id} className="group whitespace-nowrap hover:bg-muted/40">
                      <TableCell className="sticky left-0 z-10 w-12 bg-card text-right text-muted-foreground group-hover:bg-muted/40">
                        {rowNumber}
                      </TableCell>
                      <TableCell className="sticky left-12 z-10 border-r bg-card group-hover:bg-muted/40">
                        <Link href={`${basePath}/${product.id}`} className="font-medium underline-offset-4 hover:underline">
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FormTypeBadge formType={product.formType} />
                          <span className="text-muted-foreground">{product.categoryName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{text(product.brand)}</TableCell>
                      <TableCell>{text(product.cpu)}</TableCell>
                      <TableCell>{text(product.ram)}</TableCell>
                      <TableCell>{text(product.storage)}</TableCell>
                      <TableCell>{text(product.spec)}</TableCell>
                      <TableCell className="text-right tabular-nums">{modalRange}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(product.sparepartTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{jualRange}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {product.stock > 0 ? formatRupiah(product.setorSum) : "—"}
                      </TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${product.stock > 0 && product.grossSum < 0 ? "text-destructive" : product.stock > 0 ? "text-emerald-600" : ""}`}>
                        {product.stock > 0 ? formatRupiah(product.grossSum) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{text(product.source)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(product.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{snLabel(product.stock, product.snConcat)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatNumber(product.stock)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.siapJual > 0 ? <Badge variant="secondary">{formatNumber(product.siapJual)}</Badge> : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.minus > 0 ? <Badge variant="destructive">{formatNumber(product.minus)}</Badge> : <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(product.soCount)}/{formatNumber(product.stock)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(product.auditCount)}/{formatNumber(product.stock)}</TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          {product.stock > 1 ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`${basePath}/${product.id}`}>Kelola Unit</Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ListPagination
        page={page}
        totalPages={totalPages}
        prevHref={page > 1 ? hrefFor({ page: page - 1 }) : undefined}
        nextHref={page < totalPages ? hrefFor({ page: page + 1 }) : undefined}
      />
    </>
  );
}