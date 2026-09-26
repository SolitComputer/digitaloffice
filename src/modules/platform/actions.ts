"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { accounts, tenantMembers, tenants, users } from "@/db/schema";
import { isDuplicateEntryError } from "@/lib/db-errors";
import { requireSuperAdmin } from "@/modules/auth/session";
import { buildCredentialUserRows } from "@/modules/users/credential";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createTenantSchema = z.object({
  tenantName: z.string().min(2, "Nama toko minimal 2 karakter").max(120, "Nama toko terlalu panjang"),
  slug: z
    .string()
    .min(3, "Slug minimal 3 karakter")
    .max(60, "Slug maksimal 60 karakter")
    .regex(SLUG_PATTERN, "Hanya huruf kecil, angka, dan tanda minus (contoh: toko-maju)"),
  ownerName: z.string().min(2, "Nama owner minimal 2 karakter").max(120, "Nama owner terlalu panjang"),
  ownerEmail: z.email("Format email tidak valid"),
  ownerPassword: z.string().min(8, "Password minimal 8 karakter").max(128, "Password terlalu panjang"),
});

export type CreateTenantValues = {
  tenantName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
};

export type CreateTenantState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: CreateTenantValues;
  successMessage?: string;
};

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createTenantAction(
  _prevState: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  await requireSuperAdmin();

  const values: CreateTenantValues = {
    tenantName: readField(formData, "tenantName"),
    slug: readField(formData, "slug").toLowerCase(),
    ownerName: readField(formData, "ownerName"),
    ownerEmail: readField(formData, "ownerEmail").toLowerCase(),
  };

  const parsed = createTenantSchema.safeParse({
    ...values,
    ownerPassword: String(formData.get("ownerPassword") ?? ""),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: null, fieldErrors, values };
  }

  const data = parsed.data;
  const [slugTaken, emailTaken] = await Promise.all([
    db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, data.slug)).limit(1),
    db.select({ id: users.id }).from(users).where(eq(users.email, data.ownerEmail)).limit(1),
  ]);

  const fieldErrors: Record<string, string> = {};
  if (slugTaken.length > 0) fieldErrors.slug = "Slug sudah dipakai toko lain";
  if (emailTaken.length > 0) fieldErrors.ownerEmail = "Email sudah terdaftar";
  if (Object.keys(fieldErrors).length > 0) return { error: null, fieldErrors, values };

  const owner = await buildCredentialUserRows({
    name: data.ownerName,
    email: data.ownerEmail,
    password: data.ownerPassword,
  });
  const tenantId = crypto.randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(tenants).values({ id: tenantId, name: data.tenantName, slug: data.slug });
      await tx.insert(users).values(owner.user);
      await tx.insert(accounts).values(owner.account);
      await tx.insert(tenantMembers).values({ tenantId, userId: owner.userId, role: "OWNER" });
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      return { error: "Slug atau email baru saja dipakai. Silakan cek lagi.", fieldErrors: {}, values };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return {
    error: null,
    fieldErrors: {},
    values: { tenantName: "", slug: "", ownerName: "", ownerEmail: "" },
    successMessage: `Toko ${data.tenantName} berhasil dibuat.`,
  };
}

const statusSchema = z.object({
  tenantId: z.uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function setTenantStatusAction(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const parsed = statusSchema.safeParse({
    tenantId: formData.get("tenantId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  await db
    .update(tenants)
    .set({ status: parsed.data.status })
    .where(eq(tenants.id, parsed.data.tenantId));

  revalidatePath("/admin", "layout");
}