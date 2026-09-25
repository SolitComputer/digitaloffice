import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/format";
import { requireSuperAdmin } from "@/modules/auth/session";
import { getPlatformStats } from "@/modules/platform/queries";

export const metadata: Metadata = {
  title: "Ringkasan | DigitalOffice",
};

export default async function AdminPage() {
  await requireSuperAdmin();
  const stats = await getPlatformStats();
  const suspended = stats.tenants - stats.activeTenants;

  return (
    <>
      <PageHeader
        title="Ringkasan Platform"
        description="Gambaran semua toko yang memakai DigitalOffice."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Toko" value={formatNumber(stats.tenants)} />
        <StatCard
          label="Toko Aktif"
          value={formatNumber(stats.activeTenants)}
          hint={`${formatNumber(suspended)} toko di-suspend`}
        />
        <StatCard label="Total Pengguna" value={formatNumber(stats.users)} />
      </div>
    </>
  );
}