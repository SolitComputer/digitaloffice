import type { NavItem } from "@/components/app-shell/nav";
import type { TenantContext } from "@/modules/tenants/context";
import { canViewMembers, hasPermission } from "@/modules/tenants/permissions";

export function getTenantNav(tenant: TenantContext): NavItem[] {
  const base = `/toko/${tenant.tenantSlug}`;
  const items: NavItem[] = [{ href: base, label: "Dashboard", icon: "dashboard", exact: true }];

  if (hasPermission(tenant, "inventory.view")) {
    items.push({ href: `${base}/inventory`, label: "Inventory", icon: "inventory" });
  }

  if (hasPermission(tenant, "attendance.view")) {
    items.push({ href: `${base}/absensi`, label: "Absensi", icon: "attendance" });
  }

  if (hasPermission(tenant, "cashflow.view")) {
    items.push({ href: `${base}/cashflow`, label: "Cashflow", icon: "cashflow" });
  }
  
  if (canViewMembers(tenant)) {
    items.push({ href: `${base}/pengguna`, label: "Pengguna", icon: "users" });
  }

  if (hasPermission(tenant, "settings.view")) {
    items.push({ href: `${base}/pengaturan`, label: "Pengaturan", icon: "settings" });
  }

  return items;
}