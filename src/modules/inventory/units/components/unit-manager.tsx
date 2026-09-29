"use client";

import { useActionState, useEffect, useEffectEvent, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UNIT_GRADES, UNIT_STATUSES } from "@/db/schema";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import type { ProductUnitRow } from "@/modules/inventory/queries";
import { UNIT_STATUS_LABELS } from "@/modules/inventory/unit-status";
import { deleteUnitAction, updateUnitsAction, type UnitManagerState } from "@/modules/inventory/units/actions";

const initialState: UnitManagerState = { error: null, fieldErrors: {} };

type RowState = {
  sn: string;
  grade: string;
  status: string;
  source: string;
  date: string;
  cost: string;
  spare: string;
  setor: string;
  official: string;
  so: boolean;
  audit: boolean;
};

function numVal(value: string): number {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function moneyDefault(value: number): string {
  return value > 0 ? String(value) : "";
}
function toDateInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function defaultRow(u: ProductUnitRow): RowState {
  return {
    sn: u.serialNumber ?? "",
    grade: u.grade ?? "",
    status: u.status,
    source: u.source ?? "",
    date: toDateInput(u.enteredAt),
    cost: moneyDefault(u.costPrice),
    spare: moneyDefault(u.sparepartCost),
    setor: moneyDefault(u.priceSetor),
    official: moneyDefault(u.priceOfficial),
    so: u.stockOpname,
    audit: u.audited,
  };
}

type UnitManagerProps = {
  slug: string;
  productId: string;
  units: ProductUnitRow[];
};

export function UnitManager({ slug, productId, units }: UnitManagerProps) {
  const [state, formAction, isPending] = useActionState(updateUnitsAction, initialState);
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(units.map((u) => [u.id, defaultRow(u)])),
  );
  const [bulk, setBulk] = useState({ setor: "", official: "", cost: "", source: "", grade: "", status: "" });

  const unitById = Object.fromEntries(units.map((u) => [u.id, u]));

  // Sinkronkan state saat daftar unit berubah (Tambah/Hapus): tambah id baru, buang id yang hilang,
  // pertahankan editan pada unit yang masih ada.
  useEffect(() => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      let changed = units.length !== Object.keys(prev).length;
      for (const u of units) {
        if (prev[u.id]) {
          next[u.id] = prev[u.id];
        } else {
          next[u.id] = defaultRow(u);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [units]);

  const showResult = useEffectEvent((result: UnitManagerState) => {
    if (result.successMessage) toast.success(result.successMessage);
    else if (result.error) toast.error(result.error);
  });
  useEffect(() => {
    showResult(state);
  }, [state]);

  if (units.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Belum ada unit untuk barang ini.</Card>;
  }

  const setField = (id: string, key: keyof RowState, value: string | boolean) =>
    setRows((prev) => {
      const base = prev[id] ?? (unitById[id] ? defaultRow(unitById[id]) : null);
      if (!base) return prev;
      return { ...prev, [id]: { ...base, [key]: value } };
    });

  const applyBulk = () => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const u of units) {
        const r = prev[u.id] ?? defaultRow(u);
        next[u.id] = {
          ...r,
          setor: bulk.setor || r.setor,
          official: bulk.official || r.official,
          cost: bulk.cost || r.cost,
          source: bulk.source || r.source,
          grade: bulk.grade || r.grade,
          status: bulk.status || r.status,
        };
      }
      return next;
    });
    toast.success("Nilai diterapkan ke semua unit. Jangan lupa Simpan.");
  };

  return (
    <>
      <Card className="mb-4 p-4">
        <p className="mb-3 text-sm font-medium">Set ke semua unit</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-setor" className="text-xs">Harga Setor</Label>
            <Input id="bulk-setor" inputMode="numeric" value={bulk.setor} onChange={(e) => setBulk({ ...bulk, setor: e.target.value })} placeholder="—" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-official" className="text-xs">Harga Official</Label>
            <Input id="bulk-official" inputMode="numeric" value={bulk.official} onChange={(e) => setBulk({ ...bulk, official: e.target.value })} placeholder="—" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-cost" className="text-xs">Modal Laptop</Label>
            <Input id="bulk-cost" inputMode="numeric" value={bulk.cost} onChange={(e) => setBulk({ ...bulk, cost: e.target.value })} placeholder="—" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-source" className="text-xs">Sumber</Label>
            <Input id="bulk-source" value={bulk.source} onChange={(e) => setBulk({ ...bulk, source: e.target.value })} placeholder="—" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-grade" className="text-xs">Grade</Label>
            <NativeSelect id="bulk-grade" value={bulk.grade} onChange={(e) => setBulk({ ...bulk, grade: e.target.value })}>
              <option value="">— (tidak diubah)</option>
              {UNIT_GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bulk-status" className="text-xs">Status</Label>
            <NativeSelect id="bulk-status" value={bulk.status} onChange={(e) => setBulk({ ...bulk, status: e.target.value })}>
              <option value="">— (tidak diubah)</option>
              {UNIT_STATUSES.map((s) => (
                <option key={s} value={s}>{UNIT_STATUS_LABELS[s]}</option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="secondary" onClick={applyBulk}>
            Terapkan ke semua
          </Button>
        </div>
      </Card>

      <form action={formAction}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="unitIds" value={units.map((u) => u.id).join(",")} />

        <Card className="overflow-hidden py-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="whitespace-nowrap">
                  <TableHead className="text-right">No</TableHead>
                  <TableHead className="min-w-44">SN</TableHead>
                  <TableHead className="min-w-28">Grade</TableHead>
                  <TableHead className="min-w-40">Status</TableHead>
                  <TableHead className="min-w-36 text-right">Modal Laptop</TableHead>
                  <TableHead className="min-w-36 text-right">Modal Sparepart</TableHead>
                  <TableHead className="min-w-32 text-right">Total Modal</TableHead>
                  <TableHead className="min-w-36 text-right">Harga Setor</TableHead>
                  <TableHead className="min-w-36 text-right">Harga Official</TableHead>
                  <TableHead className="min-w-32 text-right">Gross Profit</TableHead>
                  <TableHead className="min-w-32 text-right">Total Jual</TableHead>
                  <TableHead className="min-w-36">Sumber</TableHead>
                  <TableHead className="min-w-40">Tgl Masuk</TableHead>
                  <TableHead className="text-center">SO</TableHead>
                  <TableHead className="text-center">Audit</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit, index) => {
                  const r = rows[unit.id] ?? defaultRow(unit);
                  const totalModal = numVal(r.cost) + numVal(r.spare);
                  const totalJual = numVal(r.setor);
                  const grossProfit = totalJual - totalModal;
                  const error = state.fieldErrors[unit.id];

                  return (
                    <TableRow key={unit.id} className="whitespace-nowrap align-top">
                      <TableCell className="text-right text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <Input
                          name={`sn__${unit.id}`}
                          value={r.sn}
                          onChange={(e) => setField(unit.id, "sn", e.target.value)}
                          placeholder="SN"
                          aria-invalid={Boolean(error)}
                          className="font-mono"
                        />
                        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
                      </TableCell>
                      <TableCell>
                        <NativeSelect name={`grade__${unit.id}`} value={r.grade} onChange={(e) => setField(unit.id, "grade", e.target.value)}>
                          <option value="">—</option>
                          {UNIT_GRADES.map((g) => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </NativeSelect>
                      </TableCell>
                      <TableCell>
                        <NativeSelect name={`status__${unit.id}`} value={r.status} onChange={(e) => setField(unit.id, "status", e.target.value)}>
                          {UNIT_STATUSES.map((s) => (
                            <option key={s} value={s}>{UNIT_STATUS_LABELS[s]}</option>
                          ))}
                        </NativeSelect>
                      </TableCell>
                      <TableCell>
                        <Input name={`cost__${unit.id}`} value={r.cost} onChange={(e) => setField(unit.id, "cost", e.target.value)} inputMode="numeric" placeholder="0" className="text-right" />
                      </TableCell>
                      <TableCell>
                        <Input name={`spare__${unit.id}`} value={r.spare} onChange={(e) => setField(unit.id, "spare", e.target.value)} inputMode="numeric" placeholder="0" className="text-right" />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatRupiah(totalModal)}</TableCell>
                      <TableCell>
                        <Input name={`setor__${unit.id}`} value={r.setor} onChange={(e) => setField(unit.id, "setor", e.target.value)} inputMode="numeric" placeholder="0" className="text-right" />
                      </TableCell>
                      <TableCell>
                        <Input name={`official__${unit.id}`} value={r.official} onChange={(e) => setField(unit.id, "official", e.target.value)} inputMode="numeric" placeholder="0" className="text-right" />
                      </TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${grossProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        {formatRupiah(grossProfit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(totalJual)}</TableCell>
                      <TableCell>
                        <Input name={`source__${unit.id}`} value={r.source} onChange={(e) => setField(unit.id, "source", e.target.value)} placeholder="Sumber" />
                      </TableCell>
                      <TableCell>
                        <Input type="date" name={`date__${unit.id}`} value={r.date} onChange={(e) => setField(unit.id, "date", e.target.value)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <input type="checkbox" name={`so__${unit.id}`} checked={r.so} onChange={(e) => setField(unit.id, "so", e.target.checked)} className="size-4 accent-primary" />
                      </TableCell>
                      <TableCell className="text-center">
                        <input type="checkbox" name={`audit__${unit.id}`} checked={r.audit} onChange={(e) => setField(unit.id, "audit", e.target.checked)} className="size-4 accent-primary" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="submit"
                          formAction={deleteUnitAction.bind(null, unit.id)}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(event) => {
                            if (!window.confirm("Hapus unit ini? Stok akan berkurang.")) event.preventDefault();
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Semua Unit"}
          </Button>
        </div>
      </form>
    </>
  );
}