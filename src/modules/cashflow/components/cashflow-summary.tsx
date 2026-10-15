import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/modules/cashflow/meta";
import type { CashflowSummary as Summary } from "@/modules/cashflow/queries";

export function CashflowSummary({ summary }: { summary: Summary }) {
  const total = summary.masuk + summary.keluar;
  const masukPct = total > 0 ? Math.round((summary.masuk / total) * 100) : 0;
  const keluarPct = total > 0 ? 100 - masukPct : 0;

  return (
    <div className="grid gap-4">
      <Card className="bg-foreground p-6 text-background">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-70">
          <Wallet className="size-4" />
          Saldo Cashflow · Semua Waktu
        </div>
        <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatRupiah(summary.saldo)}</p>
        <p className="mt-1 text-sm opacity-70">Total masuk dikurangi keluar</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <ArrowUpRight className="size-4" />
            </span>
            Masuk · {summary.countIn} transaksi
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatRupiah(summary.masuk)}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
              <ArrowDownRight className="size-4" />
            </span>
            Keluar · {summary.countOut} transaksi
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
            {formatRupiah(summary.keluar)}
          </p>
        </Card>
      </div>

      {total > 0 ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Masuk {masukPct}%</span>
            <span>Keluar {keluarPct}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-emerald-500" style={{ width: `${masukPct}%` }} />
            <div className="bg-red-500" style={{ width: `${keluarPct}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}