import type { Metadata } from "next";
import { NativeSelect } from "@/components/native-select";
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
import { TENANT_ROLES, type TenantRole } from "@/db/schema";
import { formatNumber } from "@/lib/format";
import { buildHref, readParam } from "@/lib/search-params";
import { requireSuperAdmin } from "@/modules/auth/session";
import { MemberPermissionsDialog } from "@/modules/members/components/member-permissions-dialog";
import { listPlatformMembers, listTenantOptions } from "@/modules/platform/queries";
import { getDefaultPermissions, parseStoredPermissions } from "@/modules/tenants/permissions";
import { ROLE_LABELS } from "@/modules/tenants/roles";

export const metadata: Metadata = {
  title: "Pengaturan | DigitalOffice",
};

type SettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SETTINGS_TABS = [
  { label: "Hak Akses", active: true },
  { label: "Paket", active: false },
  { label: "Maintenance", active: false },
  { label: "Log Aktivitas", active: false },
];

function readRole(value: string): TenantRole | "" {
  return TENANT_ROLES.find((role) => role === value) ?? "";
}

export default async function PlatformSettingsPage({ searchParams }: SettingsPageProps) {
  await requireSuperAdmin();

  const params = await searchParams;
  const search = readParam(params.q).trim().slice(0, 100);
  const tenantId = readParam(params.toko).slice(0, 36);
  const role = readRole(readParam(params.role));
  const page = Math.max(1, Number.parseInt(readParam(params.page), 10) || 1);

  const [{ rows, totalCount, totalPages }, tenantOptions] = await Promise.all([
    listPlatformMembers({ query: search, tenantId, role, page }),
    listTenantOptions(),
  ]);

  const hrefForPage = (target: number) =>
    buildHref("/admin/pengaturan", {
      q: search,
      toko: tenantId,
      role,
      page: target > 1 ? target : undefined,
    });

  return (
    <>
      <PageHeader title="Pengaturan" description="Pengaturan platform DigitalOffice." />

      <nav aria-label="Bagian pengaturan" className="mb-6 flex flex-wrap gap-1 border-b">
        {SETTINGS_TABS.map((tab) => (
          <span
            key={tab.label}
            aria-current={tab.active ? "page" : undefined}
            className={
              tab.active
                ? "-mb-px border-b-2 border-primary px-3 pb-2 text-sm font-medium text-foreground"
                : "flex items-center gap-1.5 px-3 pb-2 text-sm text-muted-foreground/60"
            }
          >
            {tab.label}
            {tab.active ? null : <span className="text-[10px] uppercase tracking-wide">Segera</span>}
          </span>
        ))}
      </nav>

      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Hak Akses Pengguna</h2>
        <p className="text-sm text-muted-foreground">
          {formatNumber(totalCount)} akun dari semua toko. Kepala Toko selalu memiliki akses penuh.
        </p>
      </div>

      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_160px_auto]">
        <Input name="q" defaultValue={search} placeholder="Cari nama atau email..." />
        <NativeSelect name="toko" defaultValue={tenantId} aria-label="Filter toko">
          <option value="">Semua toko</option>
          {tenantOptions.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="role" defaultValue={role} aria-label="Filter role">
          <option value="">Semua role</option>
          {TENANT_ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Toko</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hak Akses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Tidak ada akun yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((member) => (
                  <TableRow key={`${member.tenantSlug}-${member.userId}`}>
                    <TableCell>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{member.tenantName}</span>
                        {member.tenantStatus !== "ACTIVE" ? (
                          <Badge variant="destructive">Di-suspend</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                        {member.permissions !== null && member.role !== "OWNER" ? (
                          <Badge variant="outline">Akses khusus</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role === "OWNER" ? (
                        <span className="text-xs text-muted-foreground">Akses penuh</span>
                      ) : (
                        <MemberPermissionsDialog
                          slug={member.tenantSlug}
                          userId={member.userId}
                          name={member.name}
                          roleLabel={`${ROLE_LABELS[member.role]} di ${member.tenantName}`}
                          defaultPermissions={[...getDefaultPermissions(member.role)]}
                          customPermissions={parseStoredPermissions(member.permissions)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ListPagination
        page={page}
        totalPages={totalPages}
        prevHref={page > 1 ? hrefForPage(page - 1) : undefined}
        nextHref={page < totalPages ? hrefForPage(page + 1) : undefined}
      />
    </>
  );
}