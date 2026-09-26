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
import { CreateTenantForm } from "@/modules/platform/components/create-tenant-form";

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Tambah Toko
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tambah Toko</DialogTitle>
          <DialogDescription>Daftarkan toko baru beserta akun owner-nya.</DialogDescription>
        </DialogHeader>
        <CreateTenantForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}