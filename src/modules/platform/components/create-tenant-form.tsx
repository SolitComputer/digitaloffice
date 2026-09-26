"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { createTenantAction, type CreateTenantState } from "@/modules/platform/actions";

const initialState: CreateTenantState = {
  error: null,
  fieldErrors: {},
  values: { tenantName: "", slug: "", ownerName: "", ownerEmail: "" },
};

type CreateTenantFormProps = {
  onSuccess: () => void;
};

export function CreateTenantForm({ onSuccess }: CreateTenantFormProps) {
  const [state, formAction, isPending] = useActionState(createTenantAction, initialState);

  const handleSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });

  useEffect(() => {
    if (state.successMessage) handleSuccess(state.successMessage);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-6">
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold">Data Toko</legend>
        <FormField id="tenantName" label="Nama toko" defaultValue={state.values.tenantName} error={state.fieldErrors.tenantName} required />
        <FormField id="slug" label="Slug (alamat toko)" defaultValue={state.values.slug} error={state.fieldErrors.slug} hint="Huruf kecil, angka, dan tanda minus. Contoh: toko-maju-jaya" required />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold">Akun Owner</legend>
        <FormField id="ownerName" label="Nama owner" defaultValue={state.values.ownerName} error={state.fieldErrors.ownerName} required />
        <FormField id="ownerEmail" label="Email owner" type="email" autoComplete="off" defaultValue={state.values.ownerEmail} error={state.fieldErrors.ownerEmail} required />
        <FormField id="ownerPassword" label="Password awal" type="password" autoComplete="new-password" error={state.fieldErrors.ownerPassword} hint="Minimal 8 karakter. Berikan ke owner secara langsung." required />
      </fieldset>

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
          {isPending ? "Menyimpan..." : "Simpan Toko"}
        </Button>
      </DialogFooter>
    </form>
  );
}