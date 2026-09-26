import type { ReactNode } from "react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import type { TenantRole } from "@/db/schema";
import { removeMemberAction, updateMemberRoleAction } from "@/modules/members/actions";
import type { RoleOption } from "@/modules/members/components/create-member-form";

type MemberRowActionsProps = {
    slug: string;
    userId: string;
    name: string;
    role: TenantRole;
    roleOptions: RoleOption[];
    extraAction?: ReactNode;
};

export function MemberRowActions({ slug, userId, name, role, roleOptions, extraAction }: MemberRowActionsProps) {
    return (
        <div className="flex items-center justify-end gap-2">
            {extraAction}
            <form action={updateMemberRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="userId" value={userId} />
                <NativeSelect name="role" defaultValue={role} aria-label={`Role untuk ${name}`} className="w-32">
                    {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </NativeSelect>
                <Button type="submit" size="sm" variant="outline">
                    Simpan
                </Button>
            </form>
            <form action={removeMemberAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="userId" value={userId} />
                <ConfirmSubmitButton
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    confirmMessage={`Cabut akses ${name} dari toko ini?`}
                >
                    Cabut
                </ConfirmSubmitButton>
            </form>
        </div>
    );
}