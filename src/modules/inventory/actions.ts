"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products, productUnits } from "@/db/schema";
import { readField, toFieldErrors } from "@/lib/form-data";
import { parseWholeNumber } from "@/lib/number";
import { createProductSchema, productActiveSchema, updateProductSchema } from "@/modules/inventory/schemas";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts } from "@/modules/tenants/permissions";

export type ProductFieldValues = Record<string, string>;

type ProductFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: ProductFieldValues;
  successMessage?: string;
};

export type CreateProductState = ProductFormState;
export type UpdateProductState = ProductFormState;
export type ProductActionState = { error: string | null; successMessage?: string };

const TEXT_FIELDS = [
  "name",
  "brand",
  "cpu",
  "ram",
  "storage",
  "gpu",
  "display",
  "condition",
  "spec",
  "note",
] as const;

function readProductValues(formData: FormData): ProductFieldValues {
  const values: ProductFieldValues = { categoryId: readField(formData, "categoryId") };
  for (const key of TEXT_FIELDS) values[key] = readField(formData, key);
  values.costPrice = readField(formData, "costPrice");
  values.sellPrice = readField(formData, "sellPrice");
  values.stock = readField(formData, "stock");
  return values;
}

function toNumericInput(values: ProductFieldValues) {
  return {
    ...values,
    costPrice: parseWholeNumber(values.costPrice ?? "") ?? 0,
    sellPrice: parseWholeNumber(values.sellPrice ?? "") ?? 0,
  };
}

async function getCategory(tenantId: string, categoryId: string) {
  const [category] = await db
    .select({ formType: categories.formType, isActive: categories.isActive })
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.id, categoryId)))
    .limit(1);
  return category ?? null;
}

// Kolom produk dari data tervalidasi → string kosong disimpan sebagai null.
function toProductColumns(d: {
  name: string;
  brand: string;
  costPrice: number;
  sellPrice: number;
  note: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  display: string;
  condition: string;
  spec: string;
}) {
  return {
    name: d.name,
    brand: d.brand || null,
    costPrice: d.costPrice,
    sellPrice: d.sellPrice,
    note: d.note || null,
    cpu: d.cpu || null,
    ram: d.ram || null,
    storage: d.storage || null,
    gpu: d.gpu || null,
    display: d.display || null,
    condition: d.condition || null,
    spec: d.spec || null,
  };
}

export async function createProductAction(
  _prev: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = readProductValues(formData);

  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk menambah barang.", fieldErrors: {}, values };
  }
  if (!values.categoryId) {
    return { error: null, fieldErrors: { categoryId: "Pilih kategori dulu." }, values };
  }

  const category = await getCategory(tenant.tenantId, values.categoryId);
  if (!category) return { error: "Kategori tidak ditemukan.", fieldErrors: {}, values };
  if (!category.isActive) return { error: "Kategori sudah nonaktif.", fieldErrors: {}, values };

  const parsed = createProductSchema.safeParse({
    ...toNumericInput(values),
    formType: category.formType,
    stock: parseWholeNumber(values.stock ?? "") ?? undefined,
  });
  if (!parsed.success) return { error: null, fieldErrors: toFieldErrors(parsed.error), values };

  const data = parsed.data;
  const productId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(products).values({
      id: productId,
      tenantId: tenant.tenantId,
      categoryId: data.categoryId,
      createdBy: tenant.userId,
      ...toProductColumns(data),
    });

    // Isi Stok = N → buat N unit ber-SN kosong, siap diisi di Kelola Unit.
    const units = Array.from({ length: data.stock }, () => ({
      id: crypto.randomUUID(),
      tenantId: tenant.tenantId,
      productId,
      costPrice: data.costPrice, // modal awal per unit (bisa diedit di Kelola Unit)
      priceSetor: data.sellPrice,
      priceOfficial: data.sellPrice,
      enteredAt: new Date(),
    }));
    await tx.insert(productUnits).values(units);
  });

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return {
    error: null,
    fieldErrors: {},
    values: {},
    successMessage: `${data.name} ditambahkan dengan ${data.stock} unit.`,
  };
}

export async function updateProductAction(
  _prev: UpdateProductState,
  formData: FormData,
): Promise<UpdateProductState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = readProductValues(formData);
  const productId = readField(formData, "productId");

  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk mengubah barang.", fieldErrors: {}, values };
  }

  const [existing] = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(and(eq(products.tenantId, tenant.tenantId), eq(products.id, productId)))
    .limit(1);
  if (!existing) return { error: "Barang tidak ditemukan.", fieldErrors: {}, values };

  const category = await getCategory(tenant.tenantId, existing.categoryId);
  if (!category) return { error: "Kategori barang tidak ditemukan.", fieldErrors: {}, values };

  const parsed = updateProductSchema.safeParse({
    ...toNumericInput(values),
    categoryId: existing.categoryId,
    formType: category.formType,
    productId,
  });
  if (!parsed.success) {
    const fieldErrors = toFieldErrors(parsed.error);
    if (fieldErrors.productId) return { error: "Barang tidak ditemukan.", fieldErrors: {}, values };
    return { error: null, fieldErrors, values };
  }

  const data = parsed.data;
  await db
    .update(products)
    .set(toProductColumns(data))
    .where(and(eq(products.tenantId, tenant.tenantId), eq(products.id, productId)));

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return { error: null, fieldErrors: {}, values, successMessage: `${data.name} diperbarui.` };
}

export async function setProductActiveAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk mengarsipkan barang." };
  }

  const parsed = productActiveSchema.safeParse({
    productId: readField(formData, "productId"),
    active: readField(formData, "active"),
  });
  if (!parsed.success) return { error: "Barang tidak ditemukan." };

  const { productId, active } = parsed.data;
  const filter = and(eq(products.tenantId, tenant.tenantId), eq(products.id, productId));

  const [existing] = await db.select({ name: products.name }).from(products).where(filter).limit(1);
  if (!existing) return { error: "Barang tidak ditemukan." };

  await db.update(products).set({ isActive: active }).where(filter);

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return {
    error: null,
    successMessage: active ? `${existing.name} diaktifkan kembali.` : `${existing.name} diarsipkan.`,
  };
}