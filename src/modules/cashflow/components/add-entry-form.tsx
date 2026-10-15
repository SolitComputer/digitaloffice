"use client";

import { Banknote, Landmark } from "lucide-react";
import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CashflowDirection, CashflowMethod } from "@/db/schema";
import { createCashflowEntryAction, type EntryFormState } from "@/modules/cashflow/actions";

type CategoryOption = { id: string; name: string };

type AddEntryFormProps = {
  slug: string;
  direction: CashflowDirection;
  categories: CategoryOption[];
  defaultDate: string;
  onSuccess: () => void;
};

const initial: EntryFormState = { error: null, fieldErrors: {} };

function formatThousand(digits: string): string {
  return digits ? Number(digits).toLocaleString("id-ID") : "";
}

export function AddEntryForm({ slug, direction, categories, defaultDate, onSuccess }: AddEntryFormProps) {
  const [state, formAction, pending] = useActionState(createCashflowEntryAction, initial);
  const [method, setMethod] = useState<CashflowMethod>("CASH");
  const [amountDigits, setAmountDigits] = useState("");

  const handleOk = useEffectEvent((message: string) => {
    toast.success(message);
    onSuccess();
  });
  useEffect(() => {
    if (state.successMessage) handleOk(state.successMessage);
  }, [state]);

  const isIn = direction === "IN";

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="amount" value={amountDigits} />

      <div className="grid gap-2">
        <Label>Metode Pembayaran</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={method === "CASH" ? "default" : "outline"} onClick={() => setMethod("CASH")}>
            <Banknote className="size-4" /> Cash
          </Button>
          <Button type="button" variant={method === "SALDO" ? "default" : "outline"} onClick={() => setMethod("SALDO")}>
            <Landmark className="size-4" /> Saldo
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="categoryId">Kategori</Label>
        <NativeSelect id="categoryId" name="categoryId" defaultValue="">
          <option value="">— Tanpa kategori —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Belum ada kategori untuk {isIn ? "uang masuk" : "uang keluar"}. Bisa tambah di menu Kategori.
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount-display">Nominal</Label>
        <Input
          id="amount-display"
          inputMode="numeric"
          placeholder="0"
          value={formatThousand(amountDigits)}
          onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, "").slice(0, 12))}
          aria-invalid={Boolean(state.fieldErrors.amount)}
        />
        {state.fieldErrors.amount ? <p className="text-sm text-destructive">{state.fieldErrors.amount}</p> : null}
      </div>

      <FormField id="date" label="Tanggal" type="date" defaultValue={defaultDate} error={state.fieldErrors.date} required />
      <FormField id="note" label="Keterangan (opsional)" defaultValue="" error={state.fieldErrors.note} />

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
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : isIn ? "Simpan Uang Masuk" : "Simpan Pengeluaran"}
        </Button>
      </DialogFooter>
    </form>
  );
}