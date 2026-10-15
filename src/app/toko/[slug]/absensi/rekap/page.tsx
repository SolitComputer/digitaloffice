import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { readParam } from "@/lib/search-params";
import { getMonthlyRecap } from "@/modules/attendance/queries";
import { jakartaNow } from "@/modules/attendance/time";
import { requireTenant } from "@/modules/tenants/context";
import { canManageAttendance } from "@/modules/tenants/permissions";

export const metadata: Metadata = {
  title: "Rekap Absensi | DigitalOffice",
};

type RekapPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function isValidMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

export default async function RekapPage({ params, searchParams }: RekapPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tenant = await requireTenant(slug);
  if (!canManageAttendance(tenant)) notFound();

  const currentMonth = jakartaNow().date.slice(0, 7);
  const monthParam = readParam(query.bulan);
  const month = isValidMonth(monthParam) ? monthParam : currentMonth;

  const rows = await getMonthlyRecap(tenant, month);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00`),
  );
  const basePath = `/toko/${tenant.tenantSlug}/absensi`;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link href={basePath}>
          <ArrowLeft className="size-4" />
          Absensi
        </Link>
      </Button>

      <PageHeader title="Rekap Absensi" description={monthLabel} />

      <form className="mb-4 flex items-center gap-2">
        <input
          type="month"
          name="bulan"
          defaultValue={month}
          className="rounded-md border bg-transparent px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline">Tampilkan</Button>
      </form>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Hadir</TableHead>
                <TableHead className="text-right">Telat</TableHead>
                <TableHead className="text-right">Izin</TableHead>
                <TableHead className="text-right">Sakit</TableHead>
                <TableHead className="text-right">Alpha</TableHead>
                <TableHead className="text-right">Libur</TableHead>
                <TableHead className="text-right">Total Masuk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.userId} className="whitespace-nowrap">
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.hadir}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.telat}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.izin}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.sakit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.alpha > 0 ? <span className="font-medium text-destructive">{r.alpha}</span> : 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{r.libur}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{r.hadir + r.telat}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}