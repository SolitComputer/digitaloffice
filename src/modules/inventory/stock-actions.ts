"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, stockMovements, type StockMovementType } from "@/db/schema";
import { readField, toFieldErrors } from "@/lib/form-data";
import { formatNumber } from "@/lib/format";
import { parseWholeNumber } from "@/lib/number";
import { MAX_STOCK, stockMovementSchema } from "@/modules/inventory/schemas";
import { requireTenant } from "@/modules/tenants/context";
import { getAllowedMovementTypes } from "@/modules/tenants/permissions";

export type StockMovementValues = {
    type: string;
    quantity: string;
    note: string;
};

export type StockMovementState = {
    error: string | null;
    fieldErrors: Record<string, string>;
    values: StockMovementValues;
    successMessage?: string;
};

type MovementResult =
    | { ok: true; name: string; unit: string; stockAfter: number }
    | { ok: false; error: string; field?: "quantity" };

function getQuantityChange(type: StockMovementType, quantity: number, currentStock: number): number {
    if (type === "IN") return quantity;
    if (type === "OUT") return -quantity;
    return quantity - currentStock;
}

export async function recordStockMovementAction(
    _prevState: StockMovementState,
    formData: FormData,
): Promise<StockMovementState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    const values: StockMovementValues = {
        type: readField(formData, "type"),
        quantity: readField(formData, "quantity"),
        note: readField(formData, "note"),
    };

    const allowedTypes = getAllowedMovementTypes(tenant);
    if (allowedTypes.length === 0) {
        return { error: "Anda tidak punya akses untuk mencatat stok.", fieldErrors: {}, values };
    }

    const parsed = stockMovementSchema.safeParse({
        productId: readField(formData, "productId"),
        type: values.type,
        quantity: parseWholeNumber(values.quantity) ?? undefined,
        note: values.note,
    });
    if (!parsed.success) {
        const fieldErrors = toFieldErrors(parsed.error);
        if (fieldErrors.productId) return { error: "Produk tidak ditemukan.", fieldErrors: {}, values };
        return { error: null, fieldErrors, values };
    }

    const data = parsed.data;
    if (!allowedTypes.includes(data.type)) {
        return { error: "Anda tidak punya akses untuk mencatat jenis mutasi ini.", fieldErrors: {}, values };
    }

    const result = await db.transaction(async (tx): Promise<MovementResult> => {
        const filter = and(eq(products.tenantId, tenant.tenantId), eq(products.id, data.productId));
        const [product] = await tx
            .select({ name: products.name, unit: products.unit, stock: products.stock, isActive: products.isActive })
            .from(products)
            .where(filter)
            .for("update");

        if (!product) return { ok: false, error: "Produk tidak ditemukan." };
        if (!product.isActive) return { ok: false, error: "Produk sudah diarsipkan. Aktifkan kembali untuk mencatat stok." };

        const quantityChange = getQuantityChange(data.type, data.quantity, product.stock);
        const stockAfter = product.stock + quantityChange;

        if (quantityChange === 0) {
            return { ok: false, field: "quantity", error: "Stok fisik sama dengan stok sistem, tidak ada yang perlu disesuaikan." };
        }
        if (stockAfter < 0) {
            return { ok: false, field: "quantity", error: `Stok tidak cukup. Sisa ${formatNumber(product.stock)} ${product.unit}.` };
        }
        if (stockAfter > MAX_STOCK) {
            return { ok: false, field: "quantity", error: "Stok melebihi batas maksimum." };
        }

        await tx.update(products).set({ stock: stockAfter }).where(filter);
        await tx.insert(stockMovements).values({
            id: crypto.randomUUID(),
            tenantId: tenant.tenantId,
            productId: data.productId,
            type: data.type,
            quantityChange,
            stockAfter,
            note: data.note || null,
            createdBy: tenant.userId,
        });

        return { ok: true, name: product.name, unit: product.unit, stockAfter };
    });

    if (!result.ok) {
        if (result.field) return { error: null, fieldErrors: { [result.field]: result.error }, values };
        return { error: result.error, fieldErrors: {}, values };
    }

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return {
        error: null,
        fieldErrors: {},
        values: { type: data.type, quantity: "", note: "" },
        successMessage: `Stok ${result.name} sekarang ${formatNumber(result.stockAfter)} ${result.unit}.`,
    };
}
