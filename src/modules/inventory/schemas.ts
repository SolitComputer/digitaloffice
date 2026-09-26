import { z } from "zod";
import { STOCK_MOVEMENT_TYPES } from "@/db/schema";

const MAX_MONEY = 1_000_000_000_000;
const MAX_QUANTITY = 1_000_000;
export const MAX_STOCK = 1_000_000_000;

const moneySchema = z.number().int().min(0, "Tidak boleh minus").max(MAX_MONEY, "Angka terlalu besar");
const quantitySchema = z.number().int().min(0, "Tidak boleh minus").max(MAX_QUANTITY, "Angka terlalu besar");

const productFieldsSchema = z.object({
    name: z.string().min(2, "Nama produk minimal 2 karakter").max(200, "Nama produk terlalu panjang"),
    sku: z.string().max(60, "SKU maksimal 60 karakter"),
    unit: z.string().min(1, "Satuan wajib diisi").max(20, "Satuan terlalu panjang"),
    costPrice: moneySchema,
    sellPrice: moneySchema,
    minStock: quantitySchema,
});

export const createProductSchema = productFieldsSchema.extend({
    initialStock: quantitySchema,
});

export const updateProductSchema = productFieldsSchema.extend({
    productId: z.uuid(),
});

export const productActiveSchema = z.object({
    productId: z.uuid(),
    active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const stockMovementSchema = z
    .object({
        productId: z.uuid(),
        type: z.enum(STOCK_MOVEMENT_TYPES, { error: "Jenis mutasi tidak valid" }),
        quantity: z.number({ error: "Jumlah wajib diisi" }).pipe(quantitySchema),
        note: z.string().max(255, "Catatan maksimal 255 karakter"),
    })
    .superRefine((data, ctx) => {
        if (data.type !== "ADJUST" && data.quantity < 1) {
            ctx.addIssue({ code: "custom", path: ["quantity"], message: "Jumlah minimal 1" });
        }
        if (data.type !== "IN" && data.note.length < 3) {
            ctx.addIssue({ code: "custom", path: ["note"], message: "Alasan wajib diisi, minimal 3 karakter" });
        }
    });
