"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreateMemberForm,
  type RoleOption,
} from "@/modules/members/components/create-member-form";

type CreateMemberDialogProps = {
  slug: string;
  tenantName: string;
  roleOptions: RoleOption[];
};

export function CreateMemberDialog({ slug, tenantName, roleOptions }: CreateMemberDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Tambah Pengguna
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tambah Pengguna</DialogTitle>
          <DialogDescription>Buat akun baru untuk karyawan {tenantName}.</DialogDescription>
        </DialogHeader>
        <CreateMemberForm slug={slug} roleOptions={roleOptions} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}