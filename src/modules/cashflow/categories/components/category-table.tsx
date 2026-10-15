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
import { CATEGORY_TYPE_LABELS } from "@/modules/cashflow/meta";
import type { CashflowCategoryRow } from "@/modules/cashflow/categories/queries";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryDialog } from "./edit-category-dialog";

type CategoryTableProps = { slug: string; rows: CashflowCategoryRow[]; canManage: boolean };

export function CategoryTable({ slug, rows, canManage }: CategoryTableProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Dipakai untuk</TableHead>
              {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 3 : 2} className="py-10 text-center text-muted-foreground">
                  Belum ada kategori. Tambah dulu biar bisa dipakai di transaksi.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CATEGORY_TYPE_LABELS[r.type]}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <EditCategoryDialog slug={slug} id={r.id} name={r.name} type={r.type} />
                        <DeleteCategoryButton slug={slug} id={r.id} name={r.name} />
                      </div>
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