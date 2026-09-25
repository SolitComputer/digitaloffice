import { SignOutButton } from "@/modules/auth/components/sign-out-button";
import { requireSession } from "@/modules/auth/session";

export default async function NoAccessPage() {
  await requireSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Belum ada akses toko</h1>
        <p className="text-sm text-muted-foreground">
          Akun Anda belum terhubung ke toko mana pun. Hubungi admin untuk mendapatkan akses.
        </p>
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}