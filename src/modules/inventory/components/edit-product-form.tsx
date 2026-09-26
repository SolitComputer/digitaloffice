"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  updateProductAction,
  type ProductFieldValues,
  type UpdateProductState,
} from "@/modules/inventory/actions";
import { ProductFormFields } from "@/modules/inventory/components/product-form-fields";

type EditProductFormProps = {
  slug: string;
  productId: string;
  values: ProductFieldValues;
  onSuccess: () => void;
};

export function EditProductForm({ slug, productId, values, onSuccess }: EditProductFormProps) {
  const initialState: UpdateProductState = { error: null, fieldErrors: {}, values };
  const [state, formAction, isPending] = useActionState(updateProductAction, initialState);

  const handleSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });

  useEffect(() => {
    if (state.successMessage) handleSuccess(state.successMessage);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="productId" value={productId} />

      <ProductFormFields values={state.values} fieldErrors={state.fieldErrors} />

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
  );
}
