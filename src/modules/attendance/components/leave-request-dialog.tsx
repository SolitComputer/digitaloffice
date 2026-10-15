"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LEAVE_TYPES } from "@/db/schema";
import { createLeaveRequestAction, type LeaveRequestState } from "@/modules/attendance/actions";
import { LEAVE_TYPE_LABELS } from "@/modules/attendance/status-meta";

export function LeaveRequestDialog({ slug, defaultDate }: { slug: string; defaultDate: string }) {
  const initial: LeaveRequestState = {
    error: null,
    fieldErrors: {},
    values: { type: "IZIN", startDate: defaultDate, endDate: defaultDate, reason: "" },
  };
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createLeaveRequestAction, initial);

  const done = useEffectEvent((message: string) => {
    toast.success(message);
    setOpen(false);
  });
  useEffect(() => {
    if (state.successMessage) done(state.successMessage);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="size-4" />
          Ajukan Izin/Sakit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Ajukan Izin / Sakit</DialogTitle>
          <DialogDescription>Pengajuan akan menunggu persetujuan atasan.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <div className="grid gap-2">
            <Label htmlFor="type">Jenis</Label>
            <NativeSelect id="type" name="type" defaultValue={state.values.type}>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="startDate" label="Dari tanggal" type="date" defaultValue={state.values.startDate} error={state.fieldErrors.startDate} required />
            <FormField id="endDate" label="Sampai tanggal" type="date" defaultValue={state.values.endDate} error={state.fieldErrors.endDate} required />
          </div>
          <FormField id="reason" label="Alasan" defaultValue={state.values.reason} error={state.fieldErrors.reason} placeholder="Contoh: demam, urusan keluarga" required />
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>{isPending ? "Mengirim..." : "Ajukan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}