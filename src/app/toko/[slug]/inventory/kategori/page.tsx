import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts, hasPermission } from "@/modules/tenants/permissions";
import { listCategories } from "@/modules/inventory/categories/queries";
import { CategoryTable } from "@/modules/inventory/categories/components/category-table";
import { CreateCategoryDialog } from "@/modules/inventory/categories/components/create-category-dialog";

export const metadata: Metadata = {
  title: "Master Kategori | DigitalOffice",
};

type CategoriesPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { slug } = await params;
  const tenant = await requireTenant(slug);
  if (!hasPermission(tenant, "inventory.view")) notFound();

  const canManage = canManageProducts(tenant);
  const categories = await listCategories(tenant);
  const inventoryPath = `/toko/${tenant.tenantSlug}/inventory`;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={inventoryPath}>
          <ArrowLeft className="size-4" />
          Inventory
        </Link>
      </Button>

      <PageHeader
        title="Master Kategori"
        description={`${categories.length} kategori di ${tenant.tenantName}.`}
        actions={canManage ? <CreateCategoryDialog slug={tenant.tenantSlug} /> : undefined}
      />

      <CategoryTable slug={tenant.tenantSlug} rows={categories} canManage={canManage} />
    </>
  );
}