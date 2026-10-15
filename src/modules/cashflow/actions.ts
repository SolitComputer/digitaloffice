"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cashflowCategories, cashflowEntries } from "@/db/schema";
import { requireTenant } from "@/modules/tenants/context";
import { canManageCashflow } from "@/modules/tenants/permissions";
import { createEntrySchema } from "./schemas";

export type EntryFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
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

export async function createCashflowEntryAction(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const tenant = await requireTenant(read(formData, "slug"));
  if (!canManageCashflow(tenant)) return { error: "Anda tidak punya akses.", fieldErrors: {} };

  const rawCategory = read(formData, "categoryId");
  const parsed = createEntrySchema.safeParse({
    direction: read(formData, "direction"),
    method: read(formData, "method"),
    categoryId: rawCategory || null,
    amount: read(formData, "amount"),
    date: read(formData, "date"),
    note: read(formData, "note"),
  });
  if (!parsed.success) return { error: null, fieldErrors: collectErrors(parsed.error.issues) };

  const data = parsed.data;

  // Pastikan kategori memang milik toko ini (kalau diisi).
  let categoryId: string | null = null;
  if (data.categoryId) {
    const [cat] = await db
      .select({ id: cashflowCategories.id })
      .from(cashflowCategories)
      .where(and(eq(cashflowCategories.tenantId, tenant.tenantId), eq(cashflowCategories.id, data.categoryId)))
      .limit(1);
    categoryId = cat?.id ?? null;
  }

  await db.insert(cashflowEntries).values({
    id: crypto.randomUUID(),
    tenantId: tenant.tenantId,
    direction: data.direction,
    method: data.method,
    categoryId,
    amount: data.amount,
    date: data.date,
    note: data.note || null,
    createdBy: tenant.userId,
  });

  revalidatePath(`/toko/${tenant.tenantSlug}/cashflow`);
  return {
    error: null,
    fieldErrors: {},
    successMessage: data.direction === "IN" ? "Uang masuk tercatat." : "Uang keluar tercatat.",
  };
}

export async function deleteCashflowEntryAction(entryId: string, formData: FormData): Promise<void> {
  const tenant = await requireTenant(read(formData, "slug"));
  if (!canManageCashflow(tenant)) return;
  await db
    .delete(cashflowEntries)
    .where(and(eq(cashflowEntries.tenantId, tenant.tenantId), eq(cashflowEntries.id, entryId)));
  revalidatePath(`/toko/${tenant.tenantSlug}/cashflow`);
}