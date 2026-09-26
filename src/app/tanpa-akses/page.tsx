import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";

const NO_ACCESS_PATH = "/tanpa-akses";

export default async function NoAccessPage() {
  const session = await requireSession();
  const homePath = await resolveHomePath(session.user.id);
  const hasHome = homePath !== NO_ACCESS_PATH;

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold tracking-tight">
        {hasHome ? "Tidak punya akses ke toko ini" : "Belum ada akses toko"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {hasHome
          ? "Akun Anda tidak terdaftar di toko tersebut. Hubungi owner toko jika Anda seharusnya punya akses."
          : "Akun Anda belum terhubung ke toko mana pun. Hubungi admin untuk mendapatkan akses."}
      </p>
      <div className="flex justify-center gap-2">
        {hasHome ? (
          <Button asChild size="sm">
            <Link href={homePath}>Kembali ke toko saya</Link>
          </Button>
        ) : null}
        <SignOutButton />
      </div>
    </AuthShell>
  );
}
