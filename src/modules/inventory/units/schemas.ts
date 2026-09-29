import { z } from "zod";
import { UNIT_GRADES, UNIT_STATUSES } from "@/db/schema";

const MAX_MONEY = 1_000_000_000_000;
const money = z.number().int("Harus bilangan bulat").min(0, "Tidak boleh minus").max(MAX_MONEY, "Angka terlalu besar");

export const unitUpdateSchema = z.object({
  id: z.uuid(),
  serialNumber: z.string().trim().max(120, "SN maksimal 120 karakter"),
  status: z.enum(UNIT_STATUSES, { error: "Status tidak valid" }),
  grade: z.enum(UNIT_GRADES).nullable(),
  source: z.string().trim().max(150, "Sumber maksimal 150 karakter"),
  costPrice: money,
  sparepartCost: money,
  priceSetor: money,
  priceOfficial: money,
  stockOpname: z.boolean(),
  audited: z.boolean(),
  enteredAt: z.date().nullable(),
});