"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StockMovementType } from "@/db/schema";
import { formatNumber } from "@/lib/format";
import {
  StockMovementForm,
  type StockMovementProduct,
} from "@/modules/inventory/components/stock-movement-form";

type StockMovementDialogProps = {
  slug: string;
  product: StockMovementProduct;
  allowedTypes: StockMovementType[];
  size?: "sm" | "default";
};

export function StockMovementDialog({ slug, product, allowedTypes, size = "default" }: StockMovementDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={size === "sm" ? "outline" : "default"}>
          <ArrowUpDown className="size-4" />
          Catat Stok
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Catat Stok: {product.name}</DialogTitle>
          <DialogDescription>
            Stok saat ini {formatNumber(product.stock)} {product.unit}.
          </DialogDescription>
        </DialogHeader>
        <StockMovementForm
          slug={slug}
          product={product}
          allowedTypes={allowedTypes}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
