import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { CategoryRow } from "@/modules/inventory/categories/queries";
import { EditCategoryDialog } from "@/modules/inventory/categories/components/edit-category-dialog";
import { DeleteCategoryButton } from "@/modules/inventory/categories/components/delete-category-button";
import { FormTypeBadge } from "@/modules/inventory/categories/components/form-type-badge";

type CategoryTableProps = {
  slug: string;
  rows: CategoryRow[];
  canManage: boolean;
};

export function CategoryTable({ slug, rows, canManage }: CategoryTableProps) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kategori</TableHead>
              <TableHead>Tipe Form</TableHead>
              <TableHead className="text-right">Jumlah Produk</TableHead>
              <TableHead>Dibuat</TableHead>
              {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-10 text-center text-muted-foreground">
                  Belum ada kategori. Klik Tambah Kategori untuk mulai.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <FormTypeBadge formType={category.formType} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{category.productCount}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(category.createdAt)}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <EditCategoryDialog
                          slug={slug}
                          categoryId={category.id}
                          values={{ name: category.name, formType: category.formType }}
                        />
                        <DeleteCategoryButton
                          slug={slug}
                          categoryId={category.id}
                          name={category.name}
                          productCount={category.productCount}
                        />
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