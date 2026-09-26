"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createMemberAction, type CreateMemberState } from "@/modules/members/actions";

export type RoleOption = {
  value: string;
  label: string;
};

type CreateMemberFormProps = {
  slug: string;
  roleOptions: RoleOption[];
  onSuccess: () => void;
};

const initialState: CreateMemberState = {
  error: null,
  fieldErrors: {},
  values: { name: "", email: "", role: "STAFF" },
};

export function CreateMemberForm({ slug, roleOptions, onSuccess }: CreateMemberFormProps) {
  const [state, formAction, isPending] = useActionState(createMemberAction, initialState);
  const roleError = state.fieldErrors.role;

  const handleSuccess = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });

  useEffect(() => {
    if (state.successMessage) handleSuccess(state.successMessage);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <FormField id="name" label="Nama lengkap" defaultValue={state.values.name} error={state.fieldErrors.name} required />
      <FormField id="email" label="Email" type="email" autoComplete="off" defaultValue={state.values.email} error={state.fieldErrors.email} required />

      <div className="grid gap-2">
        <Label htmlFor="role">Role</Label>
        <NativeSelect
          id="role"
          name="role"
          defaultValue={state.values.role}
          aria-invalid={Boolean(roleError)}
          aria-describedby={roleError ? "role-error" : undefined}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
        {roleError ? (
          <p id="role-error" className="text-sm text-destructive">
            {roleError}
          </p>
        ) : null}
      </div>

      <FormField id="password" label="Password awal" type="password" autoComplete="new-password" error={state.fieldErrors.password} hint="Minimal 8 karakter. Berikan ke pengguna secara langsung." required />

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
          {isPending ? "Menyimpan..." : "Tambah Pengguna"}
        </Button>
      </DialogFooter>
    </form>
  );
}