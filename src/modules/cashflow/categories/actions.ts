"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cashflowCategories } from "@/db/schema";
import { requireTenant } from "@/modules/tenants/context";
import { canManageCashflow } from "@/modules/tenants/permissions";
import { createCategorySchema, updateCategorySchema } from "./schemas";

export type CategoryFormState = {
    error: string | null;
    fieldErrors: Record<string, string>;
    values: { name: string; type: string };
    successMessage?: string;
};

function read(fd: FormData, k: string): string {
    return String(fd.get(k) ?? "").trim();
}

function collectErrors(issues: readonly { path: PropertyKey[]; message: string }[]): Record<string, string> {
    const fe: Record<string, string> = {};
    for (const i of issues) {
        const k = String(i.path[0] ?? "");
        if (k && !fe[k]) fe[k] = i.message;
    }
    return fe;
}

export async function createCashflowCategoryAction(
    _prev: CategoryFormState,
    formData: FormData,
): Promise<CategoryFormState> {
    const tenant = await requireTenant(read(formData, "slug"));
    const values = { name: read(formData, "name"), type: read(formData, "type") };
    if (!canManageCashflow(tenant)) return { error: "Anda tidak punya akses.", fieldErrors: {}, values };

    const parsed = createCategorySchema.safeParse(values);
    if (!parsed.success) return { error: null, fieldErrors: collectErrors(parsed.error.issues), values };

    await db.insert(cashflowCategories).values({
        id: crypto.randomUUID(),
        tenantId: tenant.tenantId,
        name: parsed.data.name,
        type: parsed.data.type,
    });
    revalidatePath(`/toko/${tenant.tenantSlug}/cashflow/kategori`);
    return { error: null, fieldErrors: {}, values: { name: "", type: "BOTH" }, successMessage: "Kategori ditambahkan." };
}

export async function updateCashflowCategoryAction(
    _prev: CategoryFormState,
    formData: FormData,
): Promise<CategoryFormState> {
    const tenant = await requireTenant(read(formData, "slug"));
    const values = { name: read(formData, "name"), type: read(formData, "type") };
    if (!canManageCashflow(tenant)) return { error: "Anda tidak punya akses.", fieldErrors: {}, values };

    const parsed = updateCategorySchema.safeParse({ ...values, id: read(formData, "id") });
    if (!parsed.success) return { error: null, fieldErrors: collectErrors(parsed.error.issues), values };

    await db
        .update(cashflowCategories)
        .set({ name: parsed.data.name, type: parsed.data.type })
        .where(and(eq(cashflowCategories.tenantId, tenant.tenantId), eq(cashflowCategories.id, parsed.data.id)));
    revalidatePath(`/toko/${tenant.tenantSlug}/cashflow/kategori`);
    return { error: null, fieldErrors: {}, values, successMessage: "Kategori diperbarui." };
}

export async function deleteCashflowCategoryAction(categoryId: string, formData: FormData): Promise<void> {
    const tenant = await requireTenant(read(formData, "slug"));
    if (!canManageCashflow(tenant)) return;
    await db
        .delete(cashflowCategories)
        .where(and(eq(cashflowCategories.tenantId, tenant.tenantId), eq(cashflowCategories.id, categoryId)));
    revalidatePath(`/toko/${tenant.tenantSlug}/cashflow/kategori`);
}