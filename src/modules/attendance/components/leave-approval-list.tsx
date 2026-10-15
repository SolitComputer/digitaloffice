"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { decideLeaveRequestAction, type AttendanceActionState } from "@/modules/attendance/actions";
import type { PendingLeaveRow } from "@/modules/attendance/queries";
import { LEAVE_TYPE_LABELS } from "@/modules/attendance/status-meta";
import { formatDay } from "@/modules/attendance/time";

const initial: AttendanceActionState = { error: null };

type ListProps = {
  slug: string;
  rows: PendingLeaveRow[];
  currentUserId: string;
  canSelfApprove: boolean;
};

function ApprovalRow({ slug, row, blocked }: { slug: string; row: PendingLeaveRow; blocked: boolean }) {
  const [state, formAction, isPending] = useActionState(decideLeaveRequestAction, initial);
  const notify = useEffectEvent((s: AttendanceActionState) => {
    if (s.successMessage) toast.success(s.successMessage);
    else if (s.error) toast.error(s.error);
  });
  useEffect(() => { notify(state); }, [state]);

  const range = row.endDate !== row.startDate ? `${formatDay(row.startDate)} – ${formatDay(row.endDate)}` : formatDay(row.startDate);

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="font-medium">
          {row.name}
          <Badge variant="outline" className="ml-2">{LEAVE_TYPE_LABELS[row.type]}</Badge>
        </p>
        <p className="text-sm text-muted-foreground">{range} · {row.reason}</p>
      </div>

      {blocked ? (
        <span className="text-sm text-muted-foreground">Pengajuan Anda — menunggu atasan.</span>
      ) : (
        <div className="flex items-center gap-2">
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="requestId" value={row.id} />
            <input type="hidden" name="decision" value="REJECTED" />
            <Input name="decisionNote" placeholder="Alasan tolak (opsional)" className="w-44" />
            <Button type="submit" size="sm" variant="outline" disabled={isPending}>Tolak</Button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="requestId" value={row.id} />
            <input type="hidden" name="decision" value="APPROVED" />
            <Button type="submit" size="sm" disabled={isPending}>Setujui</Button>
          </form>
        </div>
      )}
    </div>
  );
}

export function LeaveApprovalList({ slug, rows, currentUserId, canSelfApprove }: ListProps) {
  if (rows.length === 0) {
    return <Card className="p-6 text-center text-sm text-muted-foreground">Tidak ada pengajuan menunggu persetujuan.</Card>;
  }
  return (
    <Card className="divide-y p-0">
      {rows.map((row) => (
        <ApprovalRow
          key={row.id}
          slug={slug}
          row={row}
          blocked={row.userId === currentUserId && !canSelfApprove}
        />
      ))}
    </Card>
  );
}