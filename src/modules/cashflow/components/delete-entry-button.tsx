import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteCashflowEntryAction } from "@/modules/cashflow/actions";

export function DeleteEntryButton({ slug, id }: { slug: string; id: string }) {
  return (
    <form action={deleteCashflowEntryAction.bind(null, id)}>
      <input type="hidden" name="slug" value={slug} />
      <ConfirmSubmitButton
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        confirmMessage="Hapus transaksi ini?"
      >
        Hapus
      </ConfirmSubmitButton>
    </form>
  );
}