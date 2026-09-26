"use server";

import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  clearLoginFailures,
  getClientIp,
  getLoginLockRemainingMs,
  recordLoginFailure,
} from "@/modules/auth/rate-limit";
import { requireSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";

const signInSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter").max(128, "Password terlalu panjang"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "Password baru harus berbeda dari password lama",
  });

export type SignInState = {
  error: string | null;
  email: string;
};

export type ChangePasswordState = {
  error: string | null;
  fieldErrors: Record<string, string>;
};

export async function signInAction(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const input = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid", email: input.email };
  }

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);

  const lockRemainingMs = await getLoginLockRemainingMs(parsed.data.email, ip);
  if (lockRemainingMs > 0) {
    const minutes = Math.ceil(lockRemainingMs / 60_000);
    return {
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.`,
      email: input.email,
    };
  }

  let destination: string;
  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: requestHeaders,
    });

    if ("twoFactorRedirect" in result && result.twoFactorRedirect) {
      destination = "/login/verifikasi";
    } else {
      destination = await resolveHomePath(result.user.id);
    }
  } catch (error) {
    if (error instanceof APIError) {
      await recordLoginFailure(parsed.data.email, ip);
      return { error: "Email atau password salah", email: input.email };
    }
    throw error;
  }

  await clearLoginFailures(parsed.data.email);
  redirect(destination);
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await requireSession({ allowPendingPasswordChange: true });

  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: null, fieldErrors };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: null, fieldErrors: { currentPassword: "Password lama salah" } };
    }
    throw error;
  }

  await db.update(users).set({ mustChangePassword: false }).where(eq(users.id, session.user.id));
  redirect(await resolveHomePath(session.user.id));
}