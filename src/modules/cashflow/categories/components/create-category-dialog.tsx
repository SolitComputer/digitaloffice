"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCashflowCategoryAction } from "@/modules/cashflow/categories/actions";
import { CategoryForm } from "./category-form";

export function CreateCategoryDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Kategori
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kategori</DialogTitle>
          <DialogDescription>Kategori untuk arus kas masuk / keluar.</DialogDescription>
        </DialogHeader>
        <CategoryForm slug={slug} action={createCashflowCategoryAction} submitLabel="Tambah" onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}