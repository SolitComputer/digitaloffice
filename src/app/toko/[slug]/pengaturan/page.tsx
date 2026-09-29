import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireTenant } from "@/modules/tenants/context";
import { hasPermission } from "@/modules/tenants/permissions";
import { ROLE_LABELS } from "@/modules/tenants/roles";

export const metadata: Metadata = {
  title: "Pengaturan | DigitalOffice",
};

type SettingsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TenantSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "settings.view")) notFound();

  return (
    <>
      <PageHeader title="Pengaturan" description={`Kelola pengaturan ${tenant.tenantName}.`} />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Toko</CardTitle>
          <CardDescription>
            Data dasar toko ini. Profil toko, pengaturan inventory, dan jam kerja segera bisa diubah di sini.
          </CardDescription>
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
    </>
  );
}