import type { Metadata } from "next";
import { AlertTriangle, Clock, Package, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { formatNumber } from "@/lib/format";
import { getInventoryStats } from "@/modules/inventory/queries";
import { requireTenant } from "@/modules/tenants/context";

export const metadata: Metadata = {
  title: "Dashboard | DigitalOffice",
};

type TenantPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TenantDashboardPage({ params }: TenantPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  const inventory = await getInventoryStats(tenant);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan aktivitas ${tenant.tenantName} hari ini.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Total Produk" value={formatNumber(inventory.totalProducts)} icon={<Package />} />
        <StatCard
          index={1}
          label="Stok Menipis"
          value={formatNumber(inventory.lowStock)}
          hint="Stok ≤ batas minimum"
          icon={<AlertTriangle />}
        />
        <StatCard index={2} label="Hadir Hari Ini" value="—" hint="Segera hadir" icon={<Clock />} />
        <StatCard index={3} label="Saldo Kas" value="—" hint="Segera hadir" icon={<Wallet />} />
      </div>
    </>
  );
}