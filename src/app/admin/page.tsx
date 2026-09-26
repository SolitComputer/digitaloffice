import type { Metadata } from "next";
import { Building2, Store, Users } from "lucide-react";
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
        <StatCard index={0} label="Total Toko" value={formatNumber(stats.tenants)} icon={<Building2 />} />
        <StatCard
          index={1}
          label="Toko Aktif"
          value={formatNumber(stats.activeTenants)}
          hint={`${formatNumber(suspended)} toko di-suspend`}
          icon={<Store />}
        />
        <StatCard index={2} label="Total Pengguna" value={formatNumber(stats.users)} icon={<Users />} />
      </div>
    </>
  );
}