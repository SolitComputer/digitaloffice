"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { createCategoryAction, type CreateCategoryState } from "@/modules/inventory/categories/actions";
import { CategoryFormFields } from "@/modules/inventory/categories/components/category-form";

const initialState: CreateCategoryState = {
  error: null,
  fieldErrors: {},
  values: { name: "", formType: "" },
};

export function CreateCategoryDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);

  const handleSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    setOpen(false);
  });

  useEffect(() => {
    if (state.successMessage) handleSuccess(state.successMessage);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Kategori
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tambah Kategori</DialogTitle>
          <DialogDescription>Tipe form menentukan field barang di kategori ini.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <CategoryFormFields values={state.values} fieldErrors={state.fieldErrors} />
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
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}