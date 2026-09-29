import type { FormType } from "@/db/schema";

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  laptop: "Laptop",
  aksesoris: "Aksesoris",
};

export type ProductField = {
  name: string; // nama input di form (dan kolom DB, kecuali "stock")
  label: string;
  required?: boolean;
  numeric?: boolean; // harga / stok
  textarea?: boolean;
};

/**
 * "stock" adalah field khusus form (bukan kolom di tabel products):
 * isi N → sistem bikin N baris product_units otomatis.
 */
export const PRODUCT_FIELDS: Record<FormType, ProductField[]> = {
  laptop: [
    { name: "name", label: "Nama Laptop", required: true },
    { name: "brand", label: "Brand" },
    { name: "cpu", label: "CPU" },
    { name: "ram", label: "RAM" },
    { name: "storage", label: "Storage" },
    { name: "gpu", label: "GPU" },
    { name: "display", label: "Display" },
    { name: "sellPrice", label: "Harga Store", required: true, numeric: true },
    { name: "condition", label: "Kondisi Umum" },
    { name: "note", label: "Catatan", textarea: true },
    { name: "stock", label: "Stok", required: true, numeric: true },
  ],
  aksesoris: [
    { name: "name", label: "Nama Aksesori", required: true },
    { name: "brand", label: "Merk" },
    { name: "spec", label: "Spesifikasi" },
    { name: "costPrice", label: "Harga Modal", numeric: true },
    { name: "sellPrice", label: "Harga Jual", required: true, numeric: true },
    { name: "stock", label: "Stok", required: true, numeric: true },
    { name: "note", label: "Keterangan", textarea: true },
  ],
};