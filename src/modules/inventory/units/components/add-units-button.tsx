"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addUnitsAction, type AddUnitsState } from "@/modules/inventory/units/actions";

const initialState: AddUnitsState = { error: null };

export function AddUnitsButton({ slug, productId }: { slug: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addUnitsAction, initialState);

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
          <Plus className="size-4" />
          Tambah Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tambah Unit</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="productId" value={productId} />
          <FormField
            id="count"
            label="Jumlah unit"
            inputMode="numeric"
            defaultValue="1"
            hint="Unit kosong dibuat, detailnya diisi di tabel Kelola Unit."
          />
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menambah..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}