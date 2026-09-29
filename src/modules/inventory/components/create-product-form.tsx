"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createProductAction, type CreateProductState } from "@/modules/inventory/actions";
import type { CategoryOption } from "@/modules/inventory/categories/queries";
import { ProductFormFields } from "@/modules/inventory/components/product-form-fields";
import { FORM_TYPE_LABELS, PRODUCT_FIELDS } from "@/modules/inventory/form-config";

const initialState: CreateProductState = { error: null, fieldErrors: {}, values: {} };

type CreateProductFormProps = {
  slug: string;
  categories: CategoryOption[];
  onSuccess: () => void;
};

export function CreateProductForm({ slug, categories, onSuccess }: CreateProductFormProps) {
  const [state, formAction, isPending] = useActionState(createProductAction, initialState);
  const [categoryId, setCategoryId] = useState("");
  const selected = categories.find((category) => category.id === categoryId);

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

      <div className="grid gap-2">
        <Label htmlFor="categoryId">Kategori</Label>
        <NativeSelect
          id="categoryId"
          name="categoryId"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-invalid={Boolean(state.fieldErrors.categoryId)}
          required
        >
          <option value="" disabled>
            -- Pilih Kategori --
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} · {FORM_TYPE_LABELS[category.formType]}
            </option>
          ))}
        </NativeSelect>
        {state.fieldErrors.categoryId ? (
          <p className="text-sm text-destructive">{state.fieldErrors.categoryId}</p>
        ) : null}
      </div>

      {selected ? (
        <ProductFormFields
          fields={PRODUCT_FIELDS[selected.formType]}
          values={state.values}
          fieldErrors={state.fieldErrors}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Pilih kategori dulu untuk menampilkan form barangnya.
        </p>
      )}

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
        <Button type="submit" disabled={!selected || isPending}>
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}