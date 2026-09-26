import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
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
import { formatNumber, formatRupiah } from "@/lib/format";
import { buildHref, readParam } from "@/lib/search-params";
import { CreateProductDialog } from "@/modules/inventory/components/create-product-dialog";
import { StockMovementDialog } from "@/modules/inventory/components/stock-movement-dialog";
import { listProducts, type ProductFilter } from "@/modules/inventory/queries";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts, getAllowedMovementTypes, hasPermission } from "@/modules/tenants/permissions";

export const metadata: Metadata = {
    title: "Inventory | DigitalOffice",
};

type InventoryPageProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTERS: { value: ProductFilter; label: string }[] = [
    { value: "semua", label: "Semua" },
    { value: "menipis", label: "Stok menipis" },
    { value: "arsip", label: "Diarsipkan" },
];

const FILTER_DESCRIPTIONS: Record<ProductFilter, string> = {
    semua: "",
    menipis: " dengan stok menipis",
    arsip: " diarsipkan",
};

function readFilter(value: string): ProductFilter {
    return FILTERS.find((item) => item.value === value)?.value ?? "semua";
}

function getEmptyMessage(filter: ProductFilter, hasSearch: boolean, canManage: boolean): string {
    if (hasSearch) return "Tidak ada produk yang cocok.";
    if (filter === "arsip") return "Tidak ada produk yang diarsipkan.";
    if (filter === "menipis") return "Tidak ada produk dengan stok menipis.";
    return canManage ? "Belum ada produk. Klik Tambah Produk untuk mulai." : "Belum ada produk.";
}

export default async function InventoryPage({ params, searchParams }: InventoryPageProps) {
    const [{ slug }, query] = await Promise.all([params, searchParams]);
    const tenant = await requireTenant(slug);
    if (!hasPermission(tenant, "inventory.view")) notFound();

    const search = readParam(query.q).trim().slice(0, 100);
    const page = Math.max(1, Number.parseInt(readParam(query.page), 10) || 1);
    const filter = readFilter(readParam(query.filter));
    const canManage = canManageProducts(tenant);
    const allowedTypes = filter === "arsip" ? [] : getAllowedMovementTypes(tenant);
    const showActions = allowedTypes.length > 0;

    const { rows, totalCount, totalPages } = await listProducts(tenant, { query: search, page, filter });
    const basePath = `/toko/${tenant.tenantSlug}/inventory`;
    const hrefFor = (overrides: { page?: number; filter?: ProductFilter }) =>
        buildHref(basePath, {
            q: search,
            filter: (overrides.filter ?? filter) === "semua" ? undefined : (overrides.filter ?? filter),
            page: overrides.page && overrides.page > 1 ? overrides.page : undefined,
        });

    return (
        <>
            <PageHeader
                title="Inventory"
                description={`${formatNumber(totalCount)} produk${FILTER_DESCRIPTIONS[filter]}`}
                actions={canManage ? <CreateProductDialog slug={tenant.tenantSlug} /> : undefined}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <form className="flex w-full max-w-md gap-2">
                    <Input name="q" defaultValue={search} placeholder="Cari nama atau SKU..." />
                    {filter !== "semua" ? <input type="hidden" name="filter" value={filter} /> : null}
                    <Button type="submit" variant="outline">
                        Cari
                    </Button>
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
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Stok</TableHead>
                                <TableHead className="text-right">Harga Jual</TableHead>
                                {showActions ? <TableHead className="text-right">Aksi</TableHead> : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showActions ? 4 : 3} className="py-10 text-center text-muted-foreground">
                                        {getEmptyMessage(filter, search !== "", canManage)}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((product) => {
                                    const isLow = product.minStock > 0 && product.stock <= product.minStock;

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Link
                                                    href={`${basePath}/${product.id}`}
                                                    className="font-medium underline-offset-4 hover:underline"
                                                >
                                                    {product.name}
                                                </Link>
                                                {product.sku ? (
                                                    <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isLow ? <Badge variant="destructive">Menipis</Badge> : null}
                                                    <span className="tabular-nums">
                                                        {formatNumber(product.stock)} {product.unit}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {formatRupiah(product.sellPrice)}
                                            </TableCell>
                                            {showActions ? (
                                                <TableCell className="text-right">
                                                    <StockMovementDialog
                                                        slug={tenant.tenantSlug}
                                                        product={{ id: product.id, name: product.name, unit: product.unit, stock: product.stock }}
                                                        allowedTypes={allowedTypes}
                                                        size="sm"
                                                    />
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