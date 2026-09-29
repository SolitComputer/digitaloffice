"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { products, productUnits, UNIT_GRADES } from "@/db/schema";
import { isDuplicateEntryError } from "@/lib/db-errors";
import { readField } from "@/lib/form-data";
import { parseWholeNumber } from "@/lib/number";
import { requireTenant } from "@/modules/tenants/context";
import { canManageProducts } from "@/modules/tenants/permissions";
import { unitUpdateSchema } from "@/modules/inventory/units/schemas";

export type UnitManagerState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  successMessage?: string;
};

function normalizeGrade(value: string): "A" | "B" | "C" | null {
  return (UNIT_GRADES as readonly string[]).includes(value) ? (value as "A" | "B" | "C") : null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateUnitsAction(
  _prev: UnitManagerState,
  formData: FormData,
): Promise<UnitManagerState> {
  const tenant = await requireTenant(readField(formData, "slug"));

  if (!canManageProducts(tenant)) {
    return { error: "Anda tidak punya akses untuk mengubah unit.", fieldErrors: {} };
  }

  const ids = readField(formData, "unitIds").split(",").filter(Boolean);
  if (ids.length === 0) return { error: "Tidak ada unit untuk disimpan.", fieldErrors: {} };

  const updates: (typeof unitUpdateSchema)["_output"][] = [];
  const fieldErrors: Record<string, string> = {};
  const seenSn = new Map<string, string>();

  for (const id of ids) {
    const parsed = unitUpdateSchema.safeParse({
      id,
      serialNumber: readField(formData, `sn__${id}`),
      status: readField(formData, `status__${id}`),
      grade: normalizeGrade(readField(formData, `grade__${id}`)),
      source: readField(formData, `source__${id}`),
      costPrice: parseWholeNumber(readField(formData, `cost__${id}`)) ?? 0,
      sparepartCost: parseWholeNumber(readField(formData, `spare__${id}`)) ?? 0,
      priceSetor: parseWholeNumber(readField(formData, `setor__${id}`)) ?? 0,
      priceOfficial: parseWholeNumber(readField(formData, `official__${id}`)) ?? 0,
      stockOpname: readField(formData, `so__${id}`) === "on",
      audited: readField(formData, `audit__${id}`) === "on",
      enteredAt: parseDate(readField(formData, `date__${id}`)),
    });

    if (!parsed.success) {
      fieldErrors[id] = parsed.error.issues[0]?.message ?? "Data tidak valid";
      continue;
    }

    const sn = parsed.data.serialNumber;
    if (sn) {
      const key = sn.toLowerCase();
      const twin = seenSn.get(key);
      if (twin) {
        fieldErrors[id] = "SN kembar dengan unit lain di form ini";
        fieldErrors[twin] = "SN kembar dengan unit lain di form ini";
        continue;
      }
      seenSn.set(key, id);
    }

    updates.push(parsed.data);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Ada isian yang perlu diperbaiki.", fieldErrors };
  }

  try {
    await db.transaction(async (tx) => {
      for (const unit of updates) {
        await tx
          .update(productUnits)
          .set({
            serialNumber: unit.serialNumber || null,
            status: unit.status,
            grade: unit.grade,
            source: unit.source || null,
            costPrice: unit.costPrice,
            sparepartCost: unit.sparepartCost,
            priceSetor: unit.priceSetor,
            priceOfficial: unit.priceOfficial,
            stockOpname: unit.stockOpname,
            audited: unit.audited,
            enteredAt: unit.enteredAt,
          })
          .where(and(eq(productUnits.tenantId, tenant.tenantId), eq(productUnits.id, unit.id)));
      }
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return { error: "Ada SN yang sudah dipakai unit lain (di produk mana pun). Cek lagi.", fieldErrors: {} };
    }
    throw error;
  }

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return { error: null, fieldErrors: {}, successMessage: `${updates.length} unit tersimpan.` };
}

export type AddUnitsState = { error: string | null; successMessage?: string };

export async function addUnitsAction(
  _prev: AddUnitsState,
  formData: FormData,
): Promise<AddUnitsState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageProducts(tenant)) return { error: "Anda tidak punya akses." };

  const productId = readField(formData, "productId");
  const count = parseWholeNumber(readField(formData, "count")) ?? 0;
  if (count < 1 || count > 100) return { error: "Jumlah unit harus 1–100." };

  const [product] = await db
    .select({ costPrice: products.costPrice, sellPrice: products.sellPrice, source: products.source })
    .from(products)
    .where(and(eq(products.tenantId, tenant.tenantId), eq(products.id, productId)))
    .limit(1);
  if (!product) return { error: "Barang tidak ditemukan." };

  const rows = Array.from({ length: count }, () => ({
    id: crypto.randomUUID(),
    tenantId: tenant.tenantId,
    productId,
    costPrice: product.costPrice,
    priceSetor: product.sellPrice,
    priceOfficial: product.sellPrice,
    source: product.source,
    enteredAt: new Date(),
  }));
  await db.insert(productUnits).values(rows);

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  return { error: null, successMessage: `${count} unit ditambahkan.` };
}

// Dipakai lewat formAction tombol (tanpa useActionState) — halaman refresh sendiri.
export async function deleteUnitAction(unitId: string, formData: FormData): Promise<void> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageProducts(tenant)) return;

  if (!unitId) return;
  
  await db.delete(productUnits).where(and(eq(productUnits.tenantId, tenant.tenantId), eq(productUnits.id, unitId)));
  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
}