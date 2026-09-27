import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberPermissionsDialog } from "@/modules/members/components/member-permissions-dialog";
import { listMembers } from "@/modules/members/queries";
import { requireTenant } from "@/modules/tenants/context";
import {
  canManagePermissions,
  getDefaultPermissions,
  hasPermission,
  parseStoredPermissions,
} from "@/modules/tenants/permissions";
import { ROLE_LABELS } from "@/modules/tenants/roles";

export const metadata: Metadata = {
  title: "Pengaturan | DigitalOffice",
};

type SettingsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "settings.view")) notFound();

  const canEditAccess = canManagePermissions(tenant);
  const staff = canEditAccess
    ? (await listMembers(tenant)).filter((member) => member.role !== "OWNER")
    : [];

  return (
    <>
      <PageHeader title="Pengaturan" description={`Kelola pengaturan ${tenant.tenantName}.`} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Toko</CardTitle>
            <CardDescription>Data dasar toko ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div className="space-y-1">
                <dt className="text-muted-foreground">Nama toko</dt>
                <dd className="font-medium">{tenant.tenantName}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Alamat di aplikasi</dt>
                <dd className="font-mono text-xs">/toko/{tenant.tenantSlug}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Peran Anda</dt>
                <dd className="font-medium">{ROLE_LABELS[tenant.role]}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {canEditAccess ? (
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Hak Akses Karyawan</CardTitle>
              <CardDescription>
                Atur halaman dan aksi yang boleh dibuka setiap karyawan. Kepala Toko selalu memiliki akses penuh.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {staff.length === 0 ? (
                <p className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
                  Belum ada karyawan selain Kepala Toko.
                </p>
              ) : (
                <ul className="divide-y border-t">
                  {staff.map((member) => (
                    <li
                      key={member.userId}
                      className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                        {member.permissions !== null ? <Badge variant="outline">Akses khusus</Badge> : null}
                        <MemberPermissionsDialog
                          slug={tenant.tenantSlug}
                          userId={member.userId}
                          name={member.name}
                          roleLabel={ROLE_LABELS[member.role]}
                          defaultPermissions={[...getDefaultPermissions(member.role)]}
                          customPermissions={parseStoredPermissions(member.permissions)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}