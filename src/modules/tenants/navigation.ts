import type { NavItem } from "@/components/app-shell/nav";

export function getTenantNav(slug: string): NavItem[] {
  const base = `/toko/${slug}`;

  return [
    { href: base, label: "Dashboard", icon: "dashboard", exact: true },
    { href: `${base}/inventory`, label: "Inventory", icon: "inventory", disabled: true },
    { href: `${base}/absensi`, label: "Absensi", icon: "attendance", disabled: true },
    { href: `${base}/cashflow`, label: "Cashflow", icon: "cashflow", disabled: true },
    { href: `${base}/pengguna`, label: "Pengguna", icon: "users", disabled: true },
  ];
}