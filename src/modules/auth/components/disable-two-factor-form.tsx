"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  disableTwoFactorAction,
  type TwoFactorFormState,
} from "@/modules/auth/two-factor-actions";

const initialState: TwoFactorFormState = { error: null };

export function DisableTwoFactorForm() {
  const [state, formAction, isPending] = useActionState(disableTwoFactorAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Untuk menonaktifkan 2FA atau mengganti HP, masukkan password Anda.
      </p>
      <FormField id="password" label="Password" type="password" autoComplete="current-password" error={state.error ?? undefined} required />
      <Button type="submit" variant="destructive" disabled={isPending}>
        {isPending ? "Memproses..." : "Nonaktifkan 2FA"}
      </Button>
    </form>
  );
}