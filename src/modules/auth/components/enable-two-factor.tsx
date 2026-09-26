"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
  confirmTwoFactorEnrollmentAction,
  startTwoFactorEnrollmentAction,
  type EnrollmentState,
  type TwoFactorFormState,
} from "@/modules/auth/two-factor-actions";

const initialEnrollment: EnrollmentState = { error: null };
const initialConfirm: TwoFactorFormState = { error: null };

export function EnableTwoFactor() {
  const [enrollment, startAction, isStarting] = useActionState(
    startTwoFactorEnrollmentAction,
    initialEnrollment,
  );
  const [confirm, confirmAction, isConfirming] = useActionState(
    confirmTwoFactorEnrollmentAction,
    initialConfirm,
  );

  if (!enrollment.qrDataUrl) {
    return (
      <form action={startAction} className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Masukkan password Anda untuk mulai mengaktifkan 2FA.
        </p>
        <FormField id="password" label="Password" type="password" autoComplete="current-password" error={enrollment.error ?? undefined} required />
        <Button type="submit" disabled={isStarting}>
          {isStarting ? "Memproses..." : "Mulai Aktifkan 2FA"}
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">1. Scan QR code</h3>
        <p className="text-sm text-muted-foreground">
          Buka Google Authenticator, Authy, atau Microsoft Authenticator, lalu scan kode ini.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={enrollment.qrDataUrl}
          alt="QR code untuk aplikasi authenticator"
          width={224}
          height={224}
          className="rounded-md border bg-white p-2"
        />
        {enrollment.secret ? (
          <p className="text-xs text-muted-foreground">
            Tidak bisa scan? Masukkan kode manual:{" "}
            <code className="break-all font-mono">{enrollment.secret}</code>
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-semibold">2. Simpan kode cadangan</h3>
        <p className="text-sm text-muted-foreground">
          Simpan di tempat aman (misalnya password manager). Setiap kode hanya bisa dipakai sekali, untuk login saat HP hilang.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-3 font-mono text-sm">
          {enrollment.backupCodes?.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </section>

      <form action={confirmAction} className="grid gap-4">
        <h3 className="text-sm font-semibold">3. Masukkan kode dari aplikasi</h3>
        <FormField id="code" label="Kode 6 digit" inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="123456" error={confirm.error ?? undefined} required />
        <Button type="submit" disabled={isConfirming}>
          {isConfirming ? "Memverifikasi..." : "Aktifkan 2FA"}
        </Button>
      </form>
    </div>
  );
}