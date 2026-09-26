"use client";

import Link from "next/link";
import { useActionState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTenantAction, type CreateTenantState } from "@/modules/platform/actions";

const initialState: CreateTenantState = {
  error: null,
  fieldErrors: {},
  values: { tenantName: "", slug: "", ownerName: "", ownerEmail: "" },
};

type FieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

function Field({ id, label, error, hint, ...inputProps }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CreateTenantForm() {
  const [state, formAction, isPending] = useActionState(createTenantAction, initialState);

  return (
    <form action={formAction} className="grid gap-6">
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold">Data Toko</legend>
        <Field id="tenantName" label="Nama toko" defaultValue={state.values.tenantName} error={state.fieldErrors.tenantName} required />
        <Field id="slug" label="Slug (alamat toko)" defaultValue={state.values.slug} error={state.fieldErrors.slug} hint="Huruf kecil, angka, dan tanda minus. Contoh: toko-maju-jaya" required />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold">Akun Owner</legend>
        <Field id="ownerName" label="Nama owner" defaultValue={state.values.ownerName} error={state.fieldErrors.ownerName} required />
        <Field id="ownerEmail" label="Email owner" type="email" autoComplete="off" defaultValue={state.values.ownerEmail} error={state.fieldErrors.ownerEmail} required />
        <Field id="ownerPassword" label="Password awal" type="password" autoComplete="new-password" error={state.fieldErrors.ownerPassword} hint="Minimal 8 karakter. Berikan ke owner secara langsung." required />
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/toko">Batal</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Toko"}
        </Button>
      </div>
    </form>
  );
}