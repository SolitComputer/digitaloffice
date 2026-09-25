import type { ReactNode } from "react";
import type { NavItem } from "./nav";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";

type AppShellProps = {
  title: string;
  subtitle: string;
  userName: string;
  items: NavItem[];
  userActions: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, userName, items, userActions, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:sticky md:top-0 md:flex md:h-screen">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-semibold tracking-tight">DigitalOffice</p>
          <p className="truncate text-xs text-muted-foreground">{title}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav items={items} />
        </div>
        <div className="border-t p-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="mb-3 truncate text-xs text-muted-foreground">{subtitle}</p>
          {userActions}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
          <MobileNav title={title} items={items} />
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