"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BackLink, NavItem } from "./nav";
import { SidebarNav } from "./sidebar-nav";

type MobileNavProps = {
  title: string;
  items: NavItem[];
  backLink?: BackLink;
};

export function MobileNav({ title, items, backLink }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-4">
        <SheetHeader className="px-0">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {backLink ? (
          <Link
            href={backLink.href}
            onClick={() => setOpen(false)}
            className="mb-2 flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {backLink.label}
          </Link>
        ) : null}
        <SidebarNav items={items} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}