import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/modules/auth/components/sign-out-button";

export function AccountActions() {
  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <Button asChild size="sm" variant="ghost">
        <Link href="/keamanan" aria-label="Keamanan akun (2FA)" title="Keamanan akun (2FA)">
          <ShieldCheck className="size-4" />
        </Link>
      </Button>
      <Button asChild size="sm" variant="ghost">
        <Link href="/ganti-password" aria-label="Ganti password" title="Ganti password">
          <KeyRound className="size-4" />
        </Link>
      </Button>
      <SignOutButton />
    </div>
  );
}