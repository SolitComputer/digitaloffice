import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BackLink, NavItem } from "./nav";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";

type AppShellProps = {
  title: string;
  subtitle: string;
  userName: string;
  items: NavItem[];
  userActions: ReactNode;
  backLink?: BackLink;
  children: ReactNode;
};

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function AppShell({
  title,
  subtitle,
  userName,
  items,
  userActions,
  backLink,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">DigitalOffice</p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
        </div>

        {backLink ? (
          <div className="px-3 pb-2">
            <Link
              href={backLink.href}
              className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {backLink.label}
            </Link>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>
          <SidebarNav items={items} />
        </div>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold ring-1 ring-border"
            >
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">{userActions}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <MobileNav title={title} items={items} backLink={backLink} />
          <p className="truncate text-sm font-semibold">{title}</p>
          <div className="ml-auto">{userActions}</div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}