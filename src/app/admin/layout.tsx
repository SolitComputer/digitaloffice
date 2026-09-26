import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AccountActions } from "@/modules/auth/components/account-actions";
import { requireSuperAdmin } from "@/modules/auth/session";
import { PLATFORM_NAV } from "@/modules/platform/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireSuperAdmin();

  return (
    <AppShell
      title="Panel Platform"
      subtitle="Super Admin"
      userName={session.user.name}
      items={PLATFORM_NAV}
      userActions={<AccountActions />}
    >
      {children}
    </AppShell>
  );
}