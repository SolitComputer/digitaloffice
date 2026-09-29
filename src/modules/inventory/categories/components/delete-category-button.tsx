"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCategoryAction, type CategoryActionState } from "@/modules/inventory/categories/actions";

type DeleteCategoryButtonProps = {
  slug: string;
  categoryId: string;
  name: string;
  productCount: number;
};

const initialState: CategoryActionState = { error: null };

export function DeleteCategoryButton({ slug, categoryId, name, productCount }: DeleteCategoryButtonProps) {
  const [state, formAction, isPending] = useActionState(deleteCategoryAction, initialState);

  const showResult = useEffectEvent((result: CategoryActionState) => {
    if (result.successMessage) toast.success(result.successMessage);
    if (result.error) toast.error(result.error);
  });

  useEffect(() => {
    showResult(state);
  }, [state]);

  const inUse = productCount > 0;

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <ConfirmSubmitButton
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={isPending || inUse}
        confirmMessage={`Hapus kategori ${name}? Tindakan ini tidak bisa dibatalkan.`}
      >
        <Trash2 className="size-4" />
        Hapus
      </ConfirmSubmitButton>
    </form>
  );
}