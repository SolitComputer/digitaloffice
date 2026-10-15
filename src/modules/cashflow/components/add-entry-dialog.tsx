"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CashflowDirection } from "@/db/schema";
import { AddEntryForm } from "./add-entry-form";

type CategoryOption = { id: string; name: string };

type AddEntryDialogProps = {
  slug: string;
  direction: CashflowDirection;
  categories: CategoryOption[];
  defaultDate: string;
};

export function AddEntryDialog({ slug, direction, categories, defaultDate }: AddEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const isIn = direction === "IN";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isIn ? "default" : "outline"}>
          {isIn ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          {isIn ? "Tambah Uang Masuk" : "Tambah Uang Keluar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isIn ? "Tambah Uang Masuk" : "Tambah Uang Keluar"}</DialogTitle>
          <DialogDescription>Nama pengisi tercatat otomatis.</DialogDescription>
        </DialogHeader>
        <AddEntryForm
          slug={slug}
          direction={direction}
          categories={categories}
          defaultDate={defaultDate}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}