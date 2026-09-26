import type { NavItem } from "@/components/app-shell/nav";
import type { TenantContext } from "@/modules/tenants/context";
import { canViewMembers } from "@/modules/tenants/permissions";

export function getTenantNav(slug: string, role: TenantContext["role"]): NavItem[] {
  const base = `/toko/${slug}`;

  const items: NavItem[] = [
    { href: base, label: "Dashboard", icon: "dashboard", exact: true },
    { href: `${base}/inventory`, label: "Inventory", icon: "inventory", disabled: true },
    { href: `${base}/absensi`, label: "Absensi", icon: "attendance", disabled: true },
    { href: `${base}/cashflow`, label: "Cashflow", icon: "cashflow", disabled: true },
  ];

  if (canViewMembers(role)) {
    items.push({ href: `${base}/pengguna`, label: "Pengguna", icon: "users" });
  }

  return items;
}