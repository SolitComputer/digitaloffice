"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { StockMovementType } from "@/db/schema";
import { formatNumber } from "@/lib/format";
import { MOVEMENT_TYPES } from "@/modules/inventory/movement-types";
import { recordStockMovementAction, type StockMovementState } from "@/modules/inventory/stock-actions";

export type StockMovementProduct = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type StockMovementFormProps = {
  slug: string;
  product: StockMovementProduct;
  allowedTypes: StockMovementType[];
  onSuccess: () => void;
};

function isMovementType(value: string): value is StockMovementType {
  return Object.hasOwn(MOVEMENT_TYPES, value);
}

export function StockMovementForm({ slug, product, allowedTypes, onSuccess }: StockMovementFormProps) {
  const initialState: StockMovementState = {
    error: null,
    fieldErrors: {},
    values: { type: allowedTypes[0] ?? "IN", quantity: "", note: "" },
  };
  const [state, formAction, isPending] = useActionState(recordStockMovementAction, initialState);
  const [type, setType] = useState<StockMovementType>(allowedTypes[0] ?? "IN");
  const meta = MOVEMENT_TYPES[type];
  const typeError = state.fieldErrors.type;

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
      <input type="hidden" name="productId" value={product.id} />

      <div className="grid gap-2">
        <Label htmlFor="type">Jenis</Label>
        <NativeSelect
          id="type"
          name="type"
          defaultValue={state.values.type}
          onChange={(event) => {
            if (isMovementType(event.target.value)) setType(event.target.value);
          }}
          aria-invalid={Boolean(typeError)}
          aria-describedby={typeError ? "type-error" : undefined}
        >
          {allowedTypes.map((option) => (
            <option key={option} value={option}>
              {MOVEMENT_TYPES[option].optionLabel}
            </option>
          ))}
        </NativeSelect>
        {typeError ? (
          <p id="type-error" className="text-sm text-destructive">
            {typeError}
          </p>
        ) : null}
      </div>

      <FormField
        id="quantity"
        label={`${meta.quantityLabel} (${product.unit})`}
        inputMode="numeric"
        defaultValue={state.values.quantity}
        error={state.fieldErrors.quantity}
        hint={
          type === "ADJUST"
            ? `Stok sistem ${formatNumber(product.stock)} ${product.unit}. Selisihnya dicatat otomatis.`
            : undefined
        }
        required
      />

      <FormField
        id="note"
        label={meta.noteLabel}
        defaultValue={state.values.note}
        error={state.fieldErrors.note}
        placeholder={meta.notePlaceholder}
        maxLength={255}
        required={type !== "IN"}
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
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
