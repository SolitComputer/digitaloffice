import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AccountActions } from "@/modules/auth/components/account-actions";
import { requireSession } from "@/modules/auth/session";
import { requireTenant } from "@/modules/tenants/context";
import { getTenantNav } from "@/modules/tenants/navigation";
import { ROLE_LABELS } from "@/modules/tenants/roles";

type TenantLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const [tenant, session] = await Promise.all([requireTenant(slug), requireSession()]);

  const backLink =
    tenant.role === "SUPER_ADMIN"
      ? { href: "/admin/toko", label: "Kembali ke Panel Platform" }
      : undefined;

  return (
    <AppShell
      title={tenant.tenantName}
      subtitle={ROLE_LABELS[tenant.role]}
      userName={session.user.name}
      items={getTenantNav(tenant)}
      userActions={<AccountActions />}
      backLink={backLink}
    >
      {children}
    </AppShell>
  );
}