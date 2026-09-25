import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan aktivitas ${tenant.tenantName} hari ini.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Produk" value="—" hint="Modul inventory segera hadir" />
        <StatCard label="Stok Menipis" value="—" hint="Modul inventory segera hadir" />
        <StatCard label="Hadir Hari Ini" value="—" hint="Modul absensi segera hadir" />
        <StatCard label="Saldo Kas" value="—" hint="Modul cashflow segera hadir" />
      </div>
    </>
  );
}