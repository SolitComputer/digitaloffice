"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavItem } from "./nav";

type SidebarNavProps = {
  items: NavItem[];
  onNavigate?: () => void;
};

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        if (item.disabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60"
            >
              <Icon className="size-4" />
              {item.label}
              <span className="ml-auto text-[10px] font-medium uppercase tracking-wide">
                Segera
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
              "before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-primary before:transition-all before:duration-200",
              isActive
                ? "bg-primary/10 text-primary before:opacity-100"
                : "text-muted-foreground before:scale-y-0 before:opacity-0 hover:translate-x-0.5 hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}