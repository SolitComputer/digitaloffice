import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/modules/auth/components/change-password-form";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";

export const metadata: Metadata = {
  title: "Ganti Password | DigitalOffice",
};

export default async function ChangePasswordPage() {
  const session = await requireSession({ allowPendingPasswordChange: true });
  const isForced = session.user.mustChangePassword;
  const homePath = isForced ? null : await resolveHomePath(session.user.id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ganti Password</CardTitle>
            <CardDescription>
              {isForced
                ? "Demi keamanan, ganti password awal Anda sebelum melanjutkan."
                : "Setelah diganti, perangkat lain yang sedang login akan otomatis keluar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
        <div className="flex items-center justify-between">
          {homePath ? (
            <Link href={homePath} className="text-sm text-muted-foreground hover:text-foreground">
              ← Kembali
            </Link>
          ) : (
            <span />
          )}
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}