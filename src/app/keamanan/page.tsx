import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readParam } from "@/lib/search-params";
import { DisableTwoFactorForm } from "@/modules/auth/components/disable-two-factor-form";
import { EnableTwoFactor } from "@/modules/auth/components/enable-two-factor";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";

export const metadata: Metadata = {
  title: "Keamanan Akun | DigitalOffice",
};

const STATUS_MESSAGES: Record<string, string> = {
  aktif: "2FA berhasil diaktifkan. Mulai login berikutnya, kode dari aplikasi authenticator akan diminta.",
  nonaktif: "2FA berhasil dinonaktifkan.",
};

type SecurityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const session = await requireSession({ allowPendingTwoFactorSetup: true });
  const params = await searchParams;
  const statusKey = readParam(params.status);
  const statusMessage = Object.hasOwn(STATUS_MESSAGES, statusKey) ? STATUS_MESSAGES[statusKey] : undefined;

  const isEnabled = Boolean(session.user.twoFactorEnabled);
  const isRequired = session.user.isSuperAdmin && !isEnabled;
  const homePath = isRequired ? null : await resolveHomePath(session.user.id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Autentikasi Dua Langkah</CardTitle>
              <Badge variant={isEnabled ? "secondary" : "outline"}>
                {isEnabled ? "Aktif" : "Belum aktif"}
              </Badge>
            </div>
            <CardDescription>
              Lindungi akun dengan kode dari aplikasi authenticator di HP, selain password.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isRequired ? (
              <p role="alert" className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">
                Akun Super Admin wajib mengaktifkan 2FA sebelum melanjutkan.
              </p>
            ) : null}
            {statusMessage ? (
              <p role="status" className="rounded-md border px-3 py-2 text-sm">
                {statusMessage}
              </p>
            ) : null}
            {isEnabled ? <DisableTwoFactorForm /> : <EnableTwoFactor />}
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