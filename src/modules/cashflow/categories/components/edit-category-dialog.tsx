"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateCashflowCategoryAction } from "@/modules/cashflow/categories/actions";
import { CategoryForm } from "./category-form";

type EditCategoryDialogProps = { slug: string; id: string; name: string; type: string };

export function EditCategoryDialog({ slug, id, name, type }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kategori</DialogTitle>
        </DialogHeader>
        <CategoryForm
          slug={slug}
          action={updateCashflowCategoryAction}
          categoryId={id}
          defaultName={name}
          defaultType={type}
          submitLabel="Simpan"
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}