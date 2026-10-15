import type { Metadata } from "next";
import type { ReactNode } from "react";
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
import { getTenantSettings } from "@/modules/tenants/queries";
import { ROLE_LABELS } from "@/modules/tenants/roles";
import { EditTenantForm } from "@/modules/tenants/components/edit-tenant-form";

export const metadata: Metadata = {
  title: "Pengaturan | DigitalOffice",
};

type SettingsPageProps = {
  params: Promise<{ slug: string }>;
};

function Detail({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</dd>
    </div>
  );
}

export default async function TenantSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "settings.view")) notFound();

  const canManage = hasPermission(tenant, "settings.manage");
  const settings = await getTenantSettings(tenant.tenantId);
  const workStartTime = settings?.workStartTime ?? "09:00";
  const workEndTime = settings?.workEndTime ?? "17:00";
  const faceRequired = settings?.faceRequired ?? false;
  const gpsRequired = settings?.gpsRequired ?? false;
  const gpsLat = settings?.gpsLat ?? "";
  const gpsLng = settings?.gpsLng ?? "";
  const gpsRadius = settings?.gpsRadius != null ? String(settings.gpsRadius) : "100";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Pengaturan" description={`Kelola pengaturan ${tenant.tenantName}.`} />

      <Card>
        <CardHeader>
          <CardTitle>Informasi Toko</CardTitle>
          <CardDescription>
            {canManage
              ? "Ubah nama toko, jam kerja, dan aturan absensi (verifikasi wajah & lokasi GPS)."
              : "Data dasar toko ini."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <EditTenantForm
              slug={tenant.tenantSlug}
              name={tenant.tenantName}
              workStartTime={workStartTime}
              workEndTime={workEndTime}
              faceRequired={faceRequired}
              gpsRequired={gpsRequired}
              gpsLat={gpsLat}
              gpsLng={gpsLng}
              gpsRadius={gpsRadius}
            />
          ) : (
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail label="Nama toko" value={tenant.tenantName} />
              <Detail label="Jam kerja" value={`${workStartTime} – ${workEndTime}`} />
              <Detail label="Verifikasi wajah" value={faceRequired ? "Wajib" : "Opsional"} />
              <Detail label="Lokasi GPS" value={gpsRequired ? `Wajib (radius ${gpsRadius} m)` : "Opsional"} />
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Toko</CardTitle>
          <CardDescription>Informasi sistem yang tidak bisa diubah.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
            <Detail label="Alamat di aplikasi" value={`/toko/${tenant.tenantSlug}`} mono />
            <Detail label="Status toko" value={tenant.isSuspended ? "Nonaktif" : "Aktif"} />
            <Detail label="Peran Anda" value={ROLE_LABELS[tenant.role]} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}