import type { StockMovementType } from "@/db/schema";

type MovementTypeMeta = {
  label: string;
  optionLabel: string;
  badgeVariant: "default" | "destructive" | "outline";
  quantityLabel: string;
  noteLabel: string;
  notePlaceholder: string;
};

export const MOVEMENT_TYPES: Record<StockMovementType, MovementTypeMeta> = {
  IN: {
    label: "Masuk",
    optionLabel: "Stok masuk",
    badgeVariant: "default",
    quantityLabel: "Jumlah masuk",
    noteLabel: "Catatan (opsional)",
    notePlaceholder: "Contoh: kiriman supplier",
  },
  OUT: {
    label: "Keluar",
    optionLabel: "Stok keluar",
    badgeVariant: "destructive",
    quantityLabel: "Jumlah keluar",
    noteLabel: "Alasan",
    notePlaceholder: "Contoh: barang rusak",
  },
  ADJUST: {
    label: "Penyesuaian",
    optionLabel: "Penyesuaian (stok opname)",
    badgeVariant: "outline",
    quantityLabel: "Stok fisik hasil hitung",
    noteLabel: "Alasan",
    notePlaceholder: "Contoh: stok opname akhir bulan",
  },
};
