import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireTenant } from "@/modules/tenants/context";
import { canManageCashflow, canViewCashflow } from "@/modules/tenants/permissions";
import { listCashflowCategories } from "@/modules/cashflow/categories/queries";
import { CategoryTable } from "@/modules/cashflow/categories/components/category-table";
import { CreateCategoryDialog } from "@/modules/cashflow/categories/components/create-category-dialog";

export const metadata: Metadata = { title: "Kategori Cashflow | DigitalOffice" };

type CategoryPageProps = { params: Promise<{ slug: string }> };

export default async function CashflowCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  if (!canViewCashflow(tenant)) notFound();

  const canManage = canManageCashflow(tenant);
  const rows = await listCashflowCategories(tenant);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={`/toko/${tenant.tenantSlug}/cashflow`}>
          <ArrowLeft className="size-4" />
          Cashflow
        </Link>
      </Button>

      <PageHeader
        title="Kategori Cashflow"
        description="Kategori untuk uang masuk & keluar. Bisa ditambah kapan saja tanpa ngoding."
        actions={canManage ? <CreateCategoryDialog slug={tenant.tenantSlug} /> : undefined}
      />

      <CategoryTable slug={tenant.tenantSlug} rows={rows} canManage={canManage} />
    </>
  );
}