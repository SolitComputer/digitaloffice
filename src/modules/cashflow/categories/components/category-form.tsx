"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CASHFLOW_CATEGORY_TYPES } from "@/db/schema";
import { CATEGORY_TYPE_LABELS } from "@/modules/cashflow/meta";
import type { CategoryFormState } from "@/modules/cashflow/categories/actions";

type CategoryFormProps = {
  slug: string;
  action: (prev: CategoryFormState, fd: FormData) => Promise<CategoryFormState>;
  categoryId?: string;
  defaultName?: string;
  defaultType?: string;
  submitLabel: string;
  onSuccess: () => void;
};

export function CategoryForm({
  slug,
  action,
  categoryId,
  defaultName = "",
  defaultType = "BOTH",
  submitLabel,
  onSuccess,
}: CategoryFormProps) {
  const initial: CategoryFormState = { error: null, fieldErrors: {}, values: { name: defaultName, type: defaultType } };
  const [state, formAction, pending] = useActionState(action, initial);

  const handleOk = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });
  useEffect(() => {
    if (state.successMessage) handleOk(state.successMessage);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      {categoryId ? <input type="hidden" name="id" value={categoryId} /> : null}

      <FormField id="name" label="Nama kategori" defaultValue={state.values.name} error={state.fieldErrors.name} required />

      <div className="grid gap-2">
        <Label htmlFor="type">Dipakai untuk</Label>
        <NativeSelect id="type" name="type" defaultValue={state.values.type} aria-invalid={Boolean(state.fieldErrors.type)}>
          {CASHFLOW_CATEGORY_TYPES.map((t) => (
            <option key={t} value={t}>
              {CATEGORY_TYPE_LABELS[t]}
            </option>
          ))}
        </NativeSelect>
        {state.fieldErrors.type ? <p className="text-sm text-destructive">{state.fieldErrors.type}</p> : null}
      </div>

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
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}