import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { TENANT_ROLES, type TenantRole } from "@/db/schema";
import { removeMemberAction, updateMemberRoleAction } from "@/modules/members/actions";
import { ROLE_LABELS } from "@/modules/tenants/roles";

type MemberRowActionsProps = {
  slug: string;
  userId: string;
  name: string;
  role: TenantRole;
};

export function MemberRowActions({ slug, userId, name, role }: MemberRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <form action={updateMemberRoleAction} className="flex items-center gap-2">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="userId" value={userId} />
        <NativeSelect name="role" defaultValue={role} aria-label={`Role untuk ${name}`} className="w-32">
          {TENANT_ROLES.map((option) => (
            <option key={option} value={option}>
              {ROLE_LABELS[option]}
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