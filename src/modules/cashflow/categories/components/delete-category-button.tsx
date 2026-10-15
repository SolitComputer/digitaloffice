import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCashflowCategoryAction } from "@/modules/cashflow/categories/actions";

export function DeleteCategoryButton({ slug, id, name }: { slug: string; id: string; name: string }) {
  return (
    <form action={deleteCashflowCategoryAction.bind(null, id)}>
      <input type="hidden" name="slug" value={slug} />
      <ConfirmSubmitButton
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        confirmMessage={`Hapus kategori "${name}"? Transaksi lama tetap tersimpan (jadi tanpa kategori).`}
      >
        Hapus
      </ConfirmSubmitButton>
    </form>
  );
}