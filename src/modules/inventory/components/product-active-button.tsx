"use client";

import { useActionState, useEffect, useEffectEvent } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { setProductActiveAction, type ProductActionState } from "@/modules/inventory/actions";

type ProductActiveButtonProps = {
  slug: string;
  productId: string;
  name: string;
  isActive: boolean;
};

const initialState: ProductActionState = { error: null };

export function ProductActiveButton({ slug, productId, name, isActive }: ProductActiveButtonProps) {
  const [state, formAction, isPending] = useActionState(setProductActiveAction, initialState);

  const showResult = useEffectEvent((result: ProductActionState) => {
    if (result.successMessage) toast.success(result.successMessage);
    if (result.error) toast.error(result.error);
  });

  useEffect(() => {
    showResult(state);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="active" value={isActive ? "false" : "true"} />
      {isActive ? (
        <ConfirmSubmitButton
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          confirmMessage={`Arsipkan ${name}? Produk tidak muncul lagi di daftar aktif, riwayat stoknya tetap tersimpan.`}
        >
          <Archive className="size-4" />
          Arsipkan
        </ConfirmSubmitButton>
      ) : (
        <Button type="submit" disabled={isPending}>
          <ArchiveRestore className="size-4" />
          Aktifkan Kembali
        </Button>
      )}
    </form>
  );
}
