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
import { formatDateTime, formatNumber } from "@/lib/format";
import { MOVEMENT_TYPES } from "@/modules/inventory/movement-types";
import type { StockMovementRow } from "@/modules/inventory/queries";

type StockMovementTableProps = {
  rows: StockMovementRow[];
  unit: string;
};

function formatChange(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function StockMovementTable({ rows, unit }: StockMovementTableProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Perubahan</TableHead>
              <TableHead className="text-right">Stok Akhir</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead>Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Belum ada riwayat stok.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((movement) => {
                const meta = MOVEMENT_TYPES[movement.type];

                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatChange(movement.quantityChange)}</TableCell>
                    <TableCell className="text-right tabular-nums whitespace-nowrap">
                      {formatNumber(movement.stockAfter)} {unit}
                    </TableCell>
                    <TableCell className="min-w-40 text-muted-foreground">{movement.note ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{movement.createdByName}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
