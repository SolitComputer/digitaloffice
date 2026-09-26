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
import { CreateProductForm } from "@/modules/inventory/components/create-product-form";

type CreateProductDialogProps = {
  slug: string;
};

export function CreateProductDialog({ slug }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Produk
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tambah Produk</DialogTitle>
          <DialogDescription>Stok awal akan tercatat otomatis di riwayat stok.</DialogDescription>
        </DialogHeader>
        <CreateProductForm slug={slug} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}