"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { Pencil } from "lucide-react";
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
import {
  updateCategoryAction,
  type CategoryFieldValues,
  type UpdateCategoryState,
} from "@/modules/inventory/categories/actions";
import { CategoryFormFields } from "@/modules/inventory/categories/components/category-form";

type EditCategoryDialogProps = {
  slug: string;
  categoryId: string;
  values: CategoryFieldValues;
};

export function EditCategoryDialog({ slug, categoryId, values }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const initialState: UpdateCategoryState = { error: null, fieldErrors: {}, values };
  const [state, formAction, isPending] = useActionState(updateCategoryAction, initialState);

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
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Kategori</DialogTitle>
          <DialogDescription>Mengubah tipe form tidak mengubah produk yang sudah ada.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="categoryId" value={categoryId} />
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
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}