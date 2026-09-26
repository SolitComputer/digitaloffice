"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  setMemberPermissionsAction,
  type MemberPermissionsState,
} from "@/modules/members/actions";
import { PERMISSION_GROUPS, type Permission } from "@/modules/tenants/permissions";

type MemberPermissionsDialogProps = {
  slug: string;
  userId: string;
  name: string;
  roleLabel: string;
  defaultPermissions: Permission[];
  customPermissions: Permission[] | null;
};

const initialState: MemberPermissionsState = { error: null };

export function MemberPermissionsDialog(props: MemberPermissionsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <SlidersHorizontal className="size-4" />
          Akses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hak Akses: {props.name}</DialogTitle>
          <DialogDescription>
            Role saat ini: {props.roleLabel}. Atur akses khusus hanya untuk akun ini di toko ini.
          </DialogDescription>
        </DialogHeader>
        <PermissionsForm {...props} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

type PermissionsFormProps = MemberPermissionsDialogProps & {
  onSuccess: () => void;
};

function PermissionsForm({
  slug,
  userId,
  defaultPermissions,
  customPermissions,
  onSuccess,
}: PermissionsFormProps) {
  const [state, formAction, isPending] = useActionState(setMemberPermissionsAction, initialState);
  const [useCustom, setUseCustom] = useState(customPermissions !== null);
  const [selected, setSelected] = useState<Set<Permission>>(
    () => new Set(customPermissions ?? defaultPermissions),
  );
  const defaultSet = new Set(defaultPermissions);

  const handleSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });

  useEffect(() => {
    if (state.successMessage) handleSuccess(state.successMessage);
  }, [state]);

  function toggle(permission: Permission, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
  }

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="mode" value={useCustom ? "custom" : "default"} />
      {useCustom
        ? [...selected].map((permission) => (
            <input key={permission} type="hidden" name="permissions" value={permission} />
          ))
        : null}

      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="custom-mode">Atur akses khusus</Label>
          <p className="text-xs text-muted-foreground">
            {useCustom ? "Centang hak akses yang diizinkan." : "Mengikuti hak akses bawaan role."}
          </p>
        </div>
        <Switch id="custom-mode" checked={useCustom} onCheckedChange={setUseCustom} />
      </div>

      {PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.label} className="grid gap-3">
          <legend className="mb-1 text-sm font-semibold">{group.label}</legend>
          {group.permissions.map((permission) => {
            const checked = useCustom ? selected.has(permission.key) : defaultSet.has(permission.key);
            const id = `perm-${permission.key}`;

            return (
              <div key={permission.key} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={checked}
                  disabled={!useCustom}
                  onCheckedChange={(value) => toggle(permission.key, value === true)}
                />
                <Label htmlFor={id} className="font-normal">
                  {permission.label}
                </Label>
              </div>
            );
          })}
        </fieldset>
      ))}

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Akses"}
        </Button>
      </DialogFooter>
    </form>
  );
}