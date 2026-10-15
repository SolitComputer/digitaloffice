import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { readParam } from "@/lib/search-params";
import { jakartaNow } from "@/modules/attendance/time";
import { AddEntryDialog } from "@/modules/cashflow/components/add-entry-dialog";
import { CashflowSummary } from "@/modules/cashflow/components/cashflow-summary";
import { CashflowTable } from "@/modules/cashflow/components/cashflow-table";
import { listActiveCategoriesFor } from "@/modules/cashflow/categories/queries";
import { getCashflowSummary, listCashflowEntries } from "@/modules/cashflow/queries";
import { requireTenant } from "@/modules/tenants/context";
import { canManageCashflow, canViewCashflow } from "@/modules/tenants/permissions";

export const metadata: Metadata = { title: "Cashflow | DigitalOffice" };

type CashflowPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashflowPage({ params, searchParams }: CashflowPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tenant = await requireTenant(slug);
  if (!canViewCashflow(tenant)) notFound();

  const canManage = canManageCashflow(tenant);
  const tab = readParam(query.tab) === "keluar" ? "keluar" : "masuk";
  const direction = tab === "keluar" ? "OUT" : "IN";
  const today = jakartaNow().date;
  const base = `/toko/${tenant.tenantSlug}/cashflow`;

  const [summary, entries, catIn, catOut] = await Promise.all([
    getCashflowSummary(tenant),
    listCashflowEntries(tenant, direction),
    canManage ? listActiveCategoriesFor(tenant, "IN") : Promise.resolve([]),
    canManage ? listActiveCategoriesFor(tenant, "OUT") : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Cashflow"
        description="Arus kas masuk & keluar (input manual)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`${base}/kategori`}>
                <Settings2 className="size-4" />
                Kategori
              </Link>
            </Button>
            {canManage ? (
              <>
                <AddEntryDialog slug={tenant.tenantSlug} direction="IN" categories={catIn} defaultDate={today} />
                <AddEntryDialog slug={tenant.tenantSlug} direction="OUT" categories={catOut} defaultDate={today} />
              </>
            ) : null}
          </div>
        }
      />

      <div className="mb-8">
        <CashflowSummary summary={summary} />
      </div>

      <div className="mb-4 flex gap-2">
        <Button asChild variant={tab === "masuk" ? "default" : "outline"} size="sm">
          <Link href={base}>Masuk</Link>
        </Button>
        <Button asChild variant={tab === "keluar" ? "default" : "outline"} size="sm">
          <Link href={`${base}?tab=keluar`}>Keluar</Link>
        </Button>
      </div>

      <CashflowTable slug={tenant.tenantSlug} rows={entries} direction={direction} canManage={canManage} />
    </>
  );
}