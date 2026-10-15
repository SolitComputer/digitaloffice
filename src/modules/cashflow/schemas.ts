import { z } from "zod";
import { CASHFLOW_DIRECTIONS, CASHFLOW_METHODS } from "@/db/schema";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const createEntrySchema = z.object({
  direction: z.enum(CASHFLOW_DIRECTIONS, { error: "Arah tidak valid" }),
  method: z.enum(CASHFLOW_METHODS, { error: "Metode tidak valid" }),
  categoryId: z.string().max(36).nullable(),
  amount: z.coerce
    .number()
    .int("Nominal harus bilangan bulat")
    .positive("Nominal harus lebih dari 0")
    .max(999_999_999_999, "Nominal terlalu besar"),
  date: z.string().regex(DATE_PATTERN, "Tanggal tidak valid"),
  note: z.string().trim().max(255, "Catatan terlalu panjang"),
});