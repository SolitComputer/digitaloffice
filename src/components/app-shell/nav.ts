import {
  Building2,
  Clock,
  LayoutDashboard,
  Package,
  Users,
  Wallet,
} from "lucide-react";

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  stores: Building2,
  inventory: Package,
  attendance: Clock,
  cashflow: Wallet,
  users: Users,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconKey;
  exact?: boolean;
  disabled?: boolean;
};

export type BackLink = {
  href: string;
  label: string;
};