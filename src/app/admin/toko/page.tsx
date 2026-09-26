import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
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
import { formatDate, formatNumber } from "@/lib/format";
import { readParam } from "@/lib/search-params";
import { requireSuperAdmin } from "@/modules/auth/session";
import { TenantStatusBadge } from "@/modules/platform/components/tenant-status-badge";
import { TenantStatusButton } from "@/modules/platform/components/tenant-status-button";
import { listTenants } from "@/modules/platform/queries";
import { CreateTenantDialog } from "@/modules/platform/components/create-tenant-dialog";

export const metadata: Metadata = {
  title: "Daftar Toko | DigitalOffice",
};

type TenantListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildPageHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/toko?${search}` : "/admin/toko";
}

export default async function TenantListPage({ searchParams }: TenantListPageProps) {
  await requireSuperAdmin();

  const params = await searchParams;
  const query = readParam(params.q).trim().slice(0, 100);
  const page = Math.max(1, Number.parseInt(readParam(params.page), 10) || 1);

  const { rows, totalCount, totalPages } = await listTenants({ query, page });

  return (
    <>
      <PageHeader
        title="Daftar Toko"
        description={`${formatNumber(totalCount)} toko terdaftar`}
        actions={<CreateTenantDialog />}
      />

      <form className="mb-4 flex max-w-md gap-2">
        <Input name="q" defaultValue={query} placeholder="Cari nama atau slug toko..." />
        <Button type="submit" variant="outline">
          Cari
        </Button>
      </form>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Anggota</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {query ? "Tidak ada toko yang cocok dengan pencarian." : "Belum ada toko."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                    </TableCell>
                    <TableCell>
                      <TenantStatusBadge status={tenant.status} />
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(tenant.memberCount)}</TableCell>
                    <TableCell>{formatDate(tenant.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/toko/${tenant.slug}`}>Buka</Link>
                        </Button>
                        <TenantStatusButton tenantId={tenant.id} status={tenant.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild size="sm" variant="outline">
                <Link href={buildPageHref(query, page - 1)}>Sebelumnya</Link>
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button asChild size="sm" variant="outline">
                <Link href={buildPageHref(query, page + 1)}>Berikutnya</Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}