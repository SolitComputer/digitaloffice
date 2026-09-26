"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireSession } from "@/modules/auth/session";

const TOTP_PATTERN = /^\d{6}$/;

export type TwoFactorFormState = {
  error: string | null;
};

export type EnrollmentState = {
  error: string | null;
  qrDataUrl?: string;
  secret?: string;
  backupCodes?: string[];
};

const signInVerifySchema = z.object({
  method: z.enum(["totp", "backup"]),
  code: z.string().min(6).max(32),
  trustDevice: z.boolean(),
});

function readCode(formData: FormData): string {
  return String(formData.get("code") ?? "").replace(/\s/g, "");
}

export async function verifySignInTwoFactorAction(
  _prevState: TwoFactorFormState,
  formData: FormData,
): Promise<TwoFactorFormState> {
  const parsed = signInVerifySchema.safeParse({
    method: formData.get("method"),
    code: readCode(formData),
    trustDevice: formData.get("trustDevice") === "on",
  });
  if (!parsed.success) return { error: "Kode tidak valid" };

  const { method, code, trustDevice } = parsed.data;
  if (method === "totp" && !TOTP_PATTERN.test(code)) {
    return { error: "Masukkan 6 digit kode dari aplikasi authenticator" };
  }

  const requestHeaders = await headers();
  try {
    if (method === "totp") {
      await auth.api.verifyTOTP({ body: { code, trustDevice }, headers: requestHeaders });
    } else {
      await auth.api.verifyBackupCode({ body: { code, trustDevice }, headers: requestHeaders });
    }
  } catch (error) {
    if (error instanceof APIError) {
      if (error.statusCode === 429) {
        return { error: "Terlalu banyak kode salah. Akun dikunci sementara, coba lagi nanti." };
      }
      return { error: "Kode salah atau sesi verifikasi sudah berakhir. Coba lagi, atau login ulang." };
    }
    throw error;
  }

  redirect("/login");
}

export async function startTwoFactorEnrollmentAction(
  _prevState: EnrollmentState,
  formData: FormData,
): Promise<EnrollmentState> {
  await requireSession({ allowPendingTwoFactorSetup: true });

  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Password wajib diisi" };

  try {
    const result = await auth.api.enableTwoFactor({
      body: { password },
      headers: await headers(),
    });
    if (!("totpURI" in result)) return { error: "Metode 2FA tidak didukung" };

    const qrDataUrl = await QRCode.toDataURL(result.totpURI, { margin: 1, width: 224 });
    const secret = new URL(result.totpURI).searchParams.get("secret") ?? undefined;
    return { error: null, qrDataUrl, secret, backupCodes: result.backupCodes };
  } catch (error) {
    if (error instanceof APIError) return { error: "Password salah" };
    throw error;
  }
}

export async function confirmTwoFactorEnrollmentAction(
  _prevState: TwoFactorFormState,
  formData: FormData,
): Promise<TwoFactorFormState> {
  await requireSession({ allowPendingTwoFactorSetup: true });

  const code = readCode(formData);
  if (!TOTP_PATTERN.test(code)) {
    return { error: "Masukkan 6 digit kode dari aplikasi authenticator" };
  }

  try {
    await auth.api.verifyTOTP({ body: { code }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Kode salah. Pastikan jam di HP diatur otomatis." };
    }
    throw error;
  }

  redirect("/keamanan?status=aktif");
}

export async function disableTwoFactorAction(
  _prevState: TwoFactorFormState,
  formData: FormData,
): Promise<TwoFactorFormState> {
  await requireSession({ allowPendingTwoFactorSetup: true });

  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Password wajib diisi" };

  try {
    await auth.api.disableTwoFactor({ body: { password }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: "Password salah" };
    throw error;
  }

  redirect("/keamanan?status=nonaktif");
}