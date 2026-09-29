"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { FormType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductFieldValues } from "@/modules/inventory/actions";
import { EditProductForm } from "@/modules/inventory/components/edit-product-form";

type EditProductDialogProps = {
  slug: string;
  productId: string;
  formType: FormType;
  values: ProductFieldValues;
};

export function EditProductDialog({ slug, productId, formType, values }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Barang</DialogTitle>
          <DialogDescription>SN & jumlah unit dikelola lewat Kelola Unit.</DialogDescription>
        </DialogHeader>
        <EditProductForm
          slug={slug}
          productId={productId}
          formType={formType}
          values={values}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}