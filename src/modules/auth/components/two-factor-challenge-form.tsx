"use client";

import { useActionState, useState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  verifySignInTwoFactorAction,
  type TwoFactorFormState,
} from "@/modules/auth/two-factor-actions";

const initialState: TwoFactorFormState = { error: null };

export function TwoFactorChallengeForm() {
  const [state, formAction, isPending] = useActionState(verifySignInTwoFactorAction, initialState);
  const [method, setMethod] = useState<"totp" | "backup">("totp");
  const isTotp = method === "totp";

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="method" value={method} />
      <FormField
        key={method}
        id="code"
        label={isTotp ? "Kode 6 digit" : "Kode cadangan"}
        inputMode={isTotp ? "numeric" : "text"}
        autoComplete={isTotp ? "one-time-code" : "off"}
        maxLength={isTotp ? 7 : 32}
        placeholder={isTotp ? "123456" : "xxxxx-xxxxx"}
        error={state.error ?? undefined}
        autoFocus
        required
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="trustDevice" className="size-4 accent-primary" />
        Percayai perangkat ini selama 30 hari
      </label>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Memverifikasi..." : "Verifikasi"}
      </Button>
      <Button type="button" variant="link" size="sm" onClick={() => setMethod(isTotp ? "backup" : "totp")}>
        {isTotp ? "Tidak bisa akses HP? Pakai kode cadangan" : "Pakai kode dari aplikasi authenticator"}
      </Button>
    </form>
  );
}