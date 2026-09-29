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
import type { CategoryOption } from "@/modules/inventory/categories/queries";
import { CreateProductForm } from "@/modules/inventory/components/create-product-form";

type CreateProductDialogProps = {
  slug: string;
  categories: CategoryOption[];
};

export function CreateProductDialog({ slug, categories }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Barang
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tambah Barang</DialogTitle>
          <DialogDescription>Field menyesuaikan tipe form kategori yang dipilih.</DialogDescription>
        </DialogHeader>
        <CreateProductForm slug={slug} categories={categories} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}