import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AuthShell subtitle="Halaman tidak ditemukan">
      <div className="space-y-4 rounded-xl border bg-card p-6 text-center shadow-lg">
        <p className="text-4xl font-semibold tracking-tight">404</p>
        <p className="text-sm text-muted-foreground">
          Halaman ini tidak ada, toko sedang dinonaktifkan, atau akun Anda tidak memiliki akses ke halaman ini.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Kembali ke beranda</Link>
        </Button>
      </div>
    </AuthShell>
  );
}