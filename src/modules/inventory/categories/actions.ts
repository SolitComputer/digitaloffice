"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { isDuplicateEntryError } from "@/lib/db-errors";
import { readField, toFieldErrors } from "@/lib/form-data";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts } from "@/modules/tenants/permissions";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@/modules/inventory/categories/schemas";

export type CategoryFieldValues = { name: string; formType: string };

type CategoryFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: CategoryFieldValues;
  successMessage?: string;
};

export type CreateCategoryState = CategoryFormState;
export type UpdateCategoryState = CategoryFormState;
export type CategoryActionState = { error: string | null; successMessage?: string };

const NAME_TAKEN = { name: "Nama kategori sudah dipakai di toko ini." };

function readCategoryValues(formData: FormData): CategoryFieldValues {
  return { name: readField(formData, "name"), formType: readField(formData, "formType") };
}

export async function createCategoryAction(
  _prev: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = readCategoryValues(formData);

  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk mengelola kategori.", fieldErrors: {}, values };
  }

  const parsed = createCategorySchema.safeParse(values);
  if (!parsed.success) return { error: null, fieldErrors: toFieldErrors(parsed.error), values };

  try {
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      tenantId: tenant.tenantId,
      name: parsed.data.name,
      formType: parsed.data.formType,
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) return { error: null, fieldErrors: NAME_TAKEN, values };
    throw error;
  }

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return {
    error: null,
    fieldErrors: {},
    values: { name: "", formType: "" },
    successMessage: `Kategori ${parsed.data.name} ditambahkan.`,
  };
}

export async function updateCategoryAction(
  _prev: UpdateCategoryState,
  formData: FormData,
): Promise<UpdateCategoryState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = readCategoryValues(formData);

  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk mengelola kategori.", fieldErrors: {}, values };
  }

  const parsed = updateCategorySchema.safeParse({ ...values, categoryId: readField(formData, "categoryId") });
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    if (fieldErrors.categoryId) return { error: "Kategori tidak ditemukan.", fieldErrors: {}, values };
    return { error: null, fieldErrors, values };
  }

  const { categoryId, ...data } = parsed.data;
  const filter = and(eq(categories.tenantId, tenant.tenantId), eq(categories.id, categoryId));

  const [existing] = await db.select({ id: categories.id }).from(categories).where(filter).limit(1);
  if (!existing) return { error: "Kategori tidak ditemukan.", fieldErrors: {}, values };

  try {
    await db.update(categories).set(data).where(filter);
  } catch (error) {
    if (isDuplicateEntryError(error)) return { error: null, fieldErrors: NAME_TAKEN, values };
    throw error;
  }

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return { error: null, fieldErrors: {}, values, successMessage: `Kategori ${data.name} diperbarui.` };
}

export async function deleteCategoryAction(
  _prev: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk menghapus kategori." };
  }

  const parsed = deleteCategorySchema.safeParse({ categoryId: readField(formData, "categoryId") });
  if (!parsed.success) return { error: "Kategori tidak ditemukan." };

  const { categoryId } = parsed.data;
  const filter = and(eq(categories.tenantId, tenant.tenantId), eq(categories.id, categoryId));

  const [existing] = await db.select({ name: categories.name }).from(categories).where(filter).limit(1);
  if (!existing) return { error: "Kategori tidak ditemukan." };

  const [used] = await db
    .select({ value: count() })
    .from(products)
    .where(and(eq(products.tenantId, tenant.tenantId), eq(products.categoryId, categoryId)));

  if ((used?.value ?? 0) > 0) {
    return { error: "Kategori masih dipakai produk. Pindahkan produknya dulu sebelum dihapus." };
  }

  await db.delete(categories).where(filter);
  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return { error: null, successMessage: `Kategori ${existing.name} dihapus.` };
}