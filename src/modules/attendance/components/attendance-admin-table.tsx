import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TodayAttendanceRow } from "@/modules/attendance/queries";
import { AdminAttendanceRow } from "@/modules/attendance/components/admin-attendance-row";

export function AttendanceAdminTable({ slug, rows }: { slug: string; rows: TodayAttendanceRow[] }) {
  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Masuk</TableHead>
              <TableHead>Pulang</TableHead>
              <TableHead>Koreksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Belum ada karyawan.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <AdminAttendanceRow
                  key={row.userId}
                  slug={slug}
                  row={{
                    userId: row.userId,
                    name: row.name,
                    status: row.status,
                    checkInAt: row.checkInAt,
                    checkOutAt: row.checkOutAt,
                    note: row.note,
                  }}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}