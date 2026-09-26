import type { NavItem } from "@/components/app-shell/nav";

export const PLATFORM_NAV: NavItem[] = [
    { href: "/admin", label: "Ringkasan", icon: "dashboard", exact: true },
    { href: "/admin/toko", label: "Daftar Toko", icon: "stores" },
];