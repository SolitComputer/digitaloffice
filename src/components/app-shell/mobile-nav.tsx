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
import type { NavItem } from "./nav";
import { SidebarNav } from "./sidebar-nav";

type MobileNavProps = {
  title: string;
  items: NavItem[];
};

export function MobileNav({ title, items }: MobileNavProps) {
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
        <SidebarNav items={items} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}