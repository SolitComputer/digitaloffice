import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CashflowDirection } from "@/db/schema";
import { formatCashflowDate, formatRupiah, METHOD_LABELS } from "@/modules/cashflow/meta";
import type { CashflowEntryRow } from "@/modules/cashflow/queries";
import { DeleteEntryButton } from "./delete-entry-button";

type CashflowTableProps = {
  slug: string;
  rows: CashflowEntryRow[];
  direction: CashflowDirection;
  canManage: boolean;
};

export function CashflowTable({ slug, rows, direction, canManage }: CashflowTableProps) {
  const isIn = direction === "IN";

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Nominal</TableHead>
              {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-10 text-center text-muted-foreground">
                  Belum ada transaksi {isIn ? "uang masuk" : "uang keluar"}.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} className="whitespace-nowrap">
                  <TableCell>{formatCashflowDate(r.date)}</TableCell>
                  <TableCell>
                    {r.categoryName ?? <span className="text-muted-foreground">Tanpa kategori</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{METHOD_LABELS[r.method]}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">{r.note ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${isIn ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {isIn ? "+" : "−"}
                    {formatRupiah(r.amount)}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <DeleteEntryButton slug={slug} id={r.id} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}