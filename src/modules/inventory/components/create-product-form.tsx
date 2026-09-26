"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { createProductAction, type CreateProductState } from "@/modules/inventory/actions";
import { ProductFormFields } from "@/modules/inventory/components/product-form-fields";

const initialState: CreateProductState = {
  error: null,
  fieldErrors: {},
  values: {
    name: "",
    sku: "",
    unit: "pcs",
    costPrice: "",
    sellPrice: "",
    initialStock: "0",
    minStock: "0",
  },
};

type CreateProductFormProps = {
  slug: string;
  onSuccess: () => void;
};

export function CreateProductForm({ slug, onSuccess }: CreateProductFormProps) {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);

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
          {isPending ? "Menyimpan..." : "Simpan Produk"}
        </Button>
      </DialogFooter>
    </form>
  );
}