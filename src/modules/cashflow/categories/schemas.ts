import { z } from "zod";
import { CASHFLOW_CATEGORY_TYPES } from "@/db/schema";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter").max(80, "Nama terlalu panjang"),
  type: z.enum(CASHFLOW_CATEGORY_TYPES, { error: "Tipe tidak valid" }),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1).max(36),
});