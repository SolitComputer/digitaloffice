import { z } from "zod";
import { FORM_TYPES } from "@/db/schema";

const MAX_MONEY = 1_000_000_000_000;
export const MAX_STOCK = 1000;

const money = z.number().int("Harus bilangan bulat").min(0, "Tidak boleh minus").max(MAX_MONEY, "Angka terlalu besar");
const optText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`).default("");

const productBase = {
  categoryId: z.uuid("Kategori tidak valid"),
  formType: z.enum(FORM_TYPES),
  name: z.string().trim().min(1, "Nama barang wajib diisi").max(200, "Nama terlalu panjang"),
  brand: optText(100),
  cpu: optText(100),
  ram: optText(60),
  storage: optText(100),
  gpu: optText(100),
  display: optText(100),
  condition: optText(150),
  spec: optText(255),
  costPrice: money.default(0),
  sellPrice: money.default(0),
  note: optText(2000),
};

export const createProductSchema = z
  .object({
    ...productBase,
    stock: z
      .number({ error: "Stok wajib diisi" })
      .int("Stok harus bilangan bulat")
      .min(1, "Stok minimal 1 unit")
      .max(MAX_STOCK, `Maksimal ${MAX_STOCK} unit sekaligus`),
  })
  .superRefine((d, ctx) => {
    if (d.sellPrice <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sellPrice"],
        message: d.formType === "laptop" ? "Harga store wajib diisi" : "Harga jual wajib diisi",
      });
    }
  });

export const updateProductSchema = z
  .object({ ...productBase, productId: z.uuid("Produk tidak ditemukan") })
  .superRefine((d, ctx) => {
    if (d.sellPrice <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sellPrice"],
        message: d.formType === "laptop" ? "Harga store wajib diisi" : "Harga jual wajib diisi",
      });
    }
  });

export const productActiveSchema = z.object({
  productId: z.uuid(),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});