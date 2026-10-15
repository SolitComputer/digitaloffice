import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MyLeaveRow } from "@/modules/attendance/queries";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_VARIANTS,
  LEAVE_TYPE_LABELS,
} from "@/modules/attendance/status-meta";
import { formatDay } from "@/modules/attendance/time";

export function MyLeaveList({ rows }: { rows: MyLeaveRow[] }) {
  if (rows.length === 0) {
    return <Card className="p-6 text-center text-sm text-muted-foreground">Belum ada pengajuan izin/sakit.</Card>;
  }
  return (
    <Card className="divide-y p-0">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-0.5">
            <p className="font-medium">
              {LEAVE_TYPE_LABELS[r.type]} · {formatDay(r.startDate)}
              {r.endDate !== r.startDate ? ` – ${formatDay(r.endDate)}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">{r.reason}</p>
            {r.decisionNote ? <p className="text-xs text-muted-foreground">Catatan: {r.decisionNote}</p> : null}
          </div>
          <Badge variant={LEAVE_STATUS_VARIANTS[r.status]}>{LEAVE_STATUS_LABELS[r.status]}</Badge>
        </div>
      ))}
    </Card>
  );
}