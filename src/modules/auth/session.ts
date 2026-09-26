import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type RequireSessionOptions = {
  allowPendingPasswordChange?: boolean;
  allowPendingTwoFactorSetup?: boolean;
};

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireSession(options: RequireSessionOptions = {}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.user.mustChangePassword && !options.allowPendingPasswordChange) {
    redirect("/ganti-password");
  }

  const needsTwoFactorSetup = session.user.isSuperAdmin && !session.user.twoFactorEnabled;
  if (needsTwoFactorSetup && !options.allowPendingTwoFactorSetup) {
    redirect("/keamanan");
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.user.isSuperAdmin) notFound();
  return session;
}