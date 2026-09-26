"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { isDuplicateEntryError } from "@/lib/db-errors";
import { readField, toFieldErrors } from "@/lib/form-data";
import { parseWholeNumber } from "@/lib/number";
import { createProductSchema, productActiveSchema, updateProductSchema } from "@/modules/inventory/schemas";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts } from "@/modules/tenants/permissions";

export type ProductFieldValues = {
    name: string;
    sku: string;
    unit: string;
    costPrice: string;
    sellPrice: string;
    minStock: string;
};

export type CreateProductValues = ProductFieldValues & {
    initialStock: string;
};

type ProductFormState<TValues> = {
    error: string | null;
    fieldErrors: Record<string, string>;
    values: TValues;
    successMessage?: string;
};

export type CreateProductState = ProductFormState<CreateProductValues>;
export type UpdateProductState = ProductFormState<ProductFieldValues>;

export type ProductActionState = {
    error: string | null;
    successMessage?: string;
};

const EMPTY_PRODUCT_VALUES: CreateProductValues = {
    name: "",
    sku: "",
    unit: "pcs",
    costPrice: "",
    sellPrice: "",
    initialStock: "0",
    minStock: "0",
};

const SKU_TAKEN_ERROR = { sku: "SKU sudah dipakai produk lain di toko ini" };

function readProductFieldValues(formData: FormData): ProductFieldValues {
    return {
        name: readField(formData, "name"),
        sku: readField(formData, "sku").toUpperCase(),
        unit: readField(formData, "unit").toLowerCase(),
        costPrice: readField(formData, "costPrice"),
        sellPrice: readField(formData, "sellPrice"),
        minStock: readField(formData, "minStock"),
    };
}

function toProductInput(values: ProductFieldValues) {
    return {
        name: values.name,
        sku: values.sku,
        unit: values.unit,
        costPrice: parseWholeNumber(values.costPrice) ?? 0,
        sellPrice: parseWholeNumber(values.sellPrice) ?? 0,
        minStock: parseWholeNumber(values.minStock) ?? 0,
    };
}

function productFilter(tenantId: string, productId: string) {
    return and(eq(products.tenantId, tenantId), eq(products.id, productId));
}

export async function createProductAction(
    _prevState: CreateProductState,
    formData: FormData,
): Promise<CreateProductState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    const values: CreateProductValues = {
        ...readProductFieldValues(formData),
        initialStock: readField(formData, "initialStock"),
    };

    if (!canManageProducts(tenant)) {
        return { error: "Anda tidak punya akses untuk menambah produk.", fieldErrors: {}, values };
    }

    const parsed = createProductSchema.safeParse({
        ...toProductInput(values),
        initialStock: parseWholeNumber(values.initialStock) ?? 0,
    });
    if (!parsed.success) return { error: null, fieldErrors: toFieldErrors(parsed.error), values };

    const data = parsed.data;
    const productId = crypto.randomUUID();

    try {
        await db.transaction(async (tx) => {
            await tx.insert(products).values({
                id: productId,
                tenantId: tenant.tenantId,
                sku: data.sku || null,
                name: data.name,
                unit: data.unit,
                costPrice: data.costPrice,
                sellPrice: data.sellPrice,
                stock: data.initialStock,
                minStock: data.minStock,
            });

            if (data.initialStock > 0) {
                await tx.insert(stockMovements).values({
                    id: crypto.randomUUID(),
                    tenantId: tenant.tenantId,
                    productId,
                    type: "IN",
                    quantityChange: data.initialStock,
                    stockAfter: data.initialStock,
                    note: "Stok awal",
                    createdBy: tenant.userId,
                });
            }
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return { error: null, fieldErrors: SKU_TAKEN_ERROR, values };
        throw error;
    }

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return {
        error: null,
        fieldErrors: {},
        values: EMPTY_PRODUCT_VALUES,
        successMessage: `${data.name} berhasil ditambahkan.`,
    };
}

export async function updateProductAction(
    _prevState: UpdateProductState,
    formData: FormData,
): Promise<UpdateProductState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    const values = readProductFieldValues(formData);

    if (!canManageProducts(tenant)) {
        return { error: "Anda tidak punya akses untuk mengubah produk.", fieldErrors: {}, values };
    }

    const parsed = updateProductSchema.safeParse({
        ...toProductInput(values),
        productId: readField(formData, "productId"),
    });
    if (!parsed.success) {
        const fieldErrors = toFieldErrors(parsed.error);
        if (fieldErrors.productId) return { error: "Produk tidak ditemukan.", fieldErrors: {}, values };
        return { error: null, fieldErrors, values };
    }

    const { productId, ...data } = parsed.data;
    const filter = productFilter(tenant.tenantId, productId);

    const [existing] = await db.select({ id: products.id }).from(products).where(filter).limit(1);
    if (!existing) return { error: "Produk tidak ditemukan.", fieldErrors: {}, values };

    try {
        await db
            .update(products)
            .set({ ...data, sku: data.sku || null })
            .where(filter);
    } catch (error) {
        if (isDuplicateEntryError(error)) return { error: null, fieldErrors: SKU_TAKEN_ERROR, values };
        throw error;
    }

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return { error: null, fieldErrors: {}, values, successMessage: `${data.name} berhasil diperbarui.` };
}

export async function setProductActiveAction(
    _prevState: ProductActionState,
    formData: FormData,
): Promise<ProductActionState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    if (!canManageProducts(tenant)) {
        return { error: "Anda tidak punya akses untuk mengarsipkan produk." };
    }

    const parsed = productActiveSchema.safeParse({
        productId: readField(formData, "productId"),
        active: readField(formData, "active"),
    });
    if (!parsed.success) return { error: "Produk tidak ditemukan." };

    const { productId, active } = parsed.data;
    const filter = productFilter(tenant.tenantId, productId);

    const [existing] = await db.select({ name: products.name }).from(products).where(filter).limit(1);
    if (!existing) return { error: "Produk tidak ditemukan." };

    await db.update(products).set({ isActive: active }).where(filter);

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return {
        error: null,
        successMessage: active ? `${existing.name} diaktifkan kembali.` : `${existing.name} diarsipkan.`,
    };
}
