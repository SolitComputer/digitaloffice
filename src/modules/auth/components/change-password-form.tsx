"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { changePasswordAction, type ChangePasswordState } from "@/modules/auth/actions";

const initialState: ChangePasswordState = { error: null, fieldErrors: {} };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <FormField id="currentPassword" label="Password lama" type="password" autoComplete="current-password" error={state.fieldErrors.currentPassword} required />
      <FormField id="newPassword" label="Password baru" type="password" autoComplete="new-password" error={state.fieldErrors.newPassword} hint="Minimal 8 karakter." required />
      <FormField id="confirmPassword" label="Ulangi password baru" type="password" autoComplete="new-password" error={state.fieldErrors.confirmPassword} required />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Menyimpan..." : "Simpan Password"}
      </Button>
    </form>
  );
}