"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveHomePath } from "@/modules/tenants/queries";

const signInSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type SignInState = {
  error: string | null;
  email: string;
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

  let userId: string;
  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
    userId = result.user.id;
  } catch (error) {
    if (error instanceof APIError) {
      return { error: "Email atau password salah", email: input.email };
    }
    throw error;
  }

  redirect(await resolveHomePath(userId));
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}