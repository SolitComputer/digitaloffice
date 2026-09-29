import { z } from "zod";
import { FORM_TYPES } from "@/db/schema";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(100, "Maksimal 100 karakter"),
  formType: z.enum(FORM_TYPES, { message: "Pilih tipe form kategori" }),
});

export const updateCategorySchema = createCategorySchema.extend({
  categoryId: z.uuid("Kategori tidak ditemukan"),
});

export const deleteCategorySchema = z.object({
  categoryId: z.uuid("Kategori tidak ditemukan"),
});