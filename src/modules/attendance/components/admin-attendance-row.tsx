"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/db/schema";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { setAttendanceAction, type AttendanceActionState } from "@/modules/attendance/actions";
import { ATTENDANCE_STATUS_LABELS } from "@/modules/attendance/status-meta";
import { formatClock } from "@/modules/attendance/time";

const initial: AttendanceActionState = { error: null };

type Row = {
  userId: string;
  name: string;
  status: AttendanceStatus | null;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  note: string | null;
};

export function AdminAttendanceRow({ slug, row }: { slug: string; row: Row }) {
  const [state, formAction, isPending] = useActionState(setAttendanceAction, initial);

  const notify = useEffectEvent((s: AttendanceActionState) => {
    if (s.successMessage) toast.success(s.successMessage);
    else if (s.error) toast.error(s.error);
  });
  useEffect(() => { notify(state); }, [state]);

  return (
    <TableRow className="whitespace-nowrap">
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>
        {row.status ? ATTENDANCE_STATUS_LABELS[row.status] : <span className="text-muted-foreground">Belum absen</span>}
      </TableCell>
      <TableCell className="tabular-nums">{formatClock(row.checkInAt)}</TableCell>
      <TableCell className="tabular-nums">{formatClock(row.checkOutAt)}</TableCell>
      <TableCell>
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="userId" value={row.userId} />
          <NativeSelect name="status" defaultValue={row.status ?? "HADIR"} className="w-32">
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>
            ))}
          </NativeSelect>
          <Input name="note" defaultValue={row.note ?? ""} placeholder="Catatan" className="w-40" />
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "..." : "Simpan"}
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );
}