import type { CashflowCategoryType, CashflowDirection, CashflowMethod } from "@/db/schema";

export const DIRECTION_LABELS: Record<CashflowDirection, string> = {
  IN: "Uang Masuk",
  OUT: "Uang Keluar",
};

export const METHOD_LABELS: Record<CashflowMethod, string> = {
  CASH: "Cash",
  SALDO: "Saldo",
};

export const CATEGORY_TYPE_LABELS: Record<CashflowCategoryType, string> = {
  IN: "Masuk",
  OUT: "Keluar",
  BOTH: "Masuk & Keluar",
};

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCashflowDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${dateStr}T00:00:00`),
  );
}