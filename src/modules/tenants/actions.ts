"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { requireTenant } from "@/modules/tenants/context";
import { hasPermission } from "@/modules/tenants/permissions";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const updateTenantSchema = z.object({
  name: z.string().trim().min(2, "Nama toko minimal 2 karakter").max(120, "Nama toko terlalu panjang"),
  workStartTime: z.string().regex(TIME_PATTERN, "Format jam tidak valid (contoh: 09:00)"),
  workEndTime: z.string().regex(TIME_PATTERN, "Format jam tidak valid (contoh: 17:00)"),
});

export type UpdateTenantState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: {
    name: string;
    workStartTime: string;
    workEndTime: string;
    faceRequired: boolean;
    gpsRequired: boolean;
    gpsLat: string;
    gpsLng: string;
    gpsRadius: string;
  };
  successMessage?: string;
};

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateTenantAction(
  _prev: UpdateTenantState,
  formData: FormData,
): Promise<UpdateTenantState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = {
    name: readField(formData, "name"),
    workStartTime: readField(formData, "workStartTime"),
    workEndTime: readField(formData, "workEndTime"),
    faceRequired: readField(formData, "faceRequired") === "on",
    gpsRequired: readField(formData, "gpsRequired") === "on",
    gpsLat: readField(formData, "gpsLat"),
    gpsLng: readField(formData, "gpsLng"),
    gpsRadius: readField(formData, "gpsRadius"),
  };

  if (!hasPermission(tenant, "settings.manage")) {
    return { error: "Anda tidak punya akses untuk mengubah pengaturan toko.", fieldErrors: {}, values };
  }

  const parsed = updateTenantSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: null, fieldErrors, values };
  }

  // --- Validasi GPS ---
  const gpsFieldErrors: Record<string, string> = {};
  const latNum = Number(values.gpsLat);
  const lngNum = Number(values.gpsLng);
  const hasLat = values.gpsLat !== "" && Number.isFinite(latNum) && Math.abs(latNum) <= 90;
  const hasLng = values.gpsLng !== "" && Number.isFinite(lngNum) && Math.abs(lngNum) <= 180;

  if (values.gpsLat !== "" && !hasLat) gpsFieldErrors.gpsLat = "Latitude tidak valid (-90 s/d 90).";
  if (values.gpsLng !== "" && !hasLng) gpsFieldErrors.gpsLng = "Longitude tidak valid (-180 s/d 180).";
  if (values.gpsRequired && (!hasLat || !hasLng)) {
    gpsFieldErrors.gpsLat = gpsFieldErrors.gpsLat ?? "Titik lokasi toko wajib diisi kalau GPS diaktifkan.";
  }
  if (Object.keys(gpsFieldErrors).length > 0) {
    return { error: null, fieldErrors: gpsFieldErrors, values };
  }

  const gpsLat = hasLat && hasLng ? String(latNum) : null;
  const gpsLng = hasLat && hasLng ? String(lngNum) : null;
  const radiusNum = Math.trunc(Number(values.gpsRadius));
  const gpsRadius =
    Number.isFinite(radiusNum) && radiusNum > 0 ? Math.min(Math.max(radiusNum, 10), 5000) : 100;

  await db
    .update(tenants)
    .set({
      name: parsed.data.name,
      workStartTime: parsed.data.workStartTime,
      workEndTime: parsed.data.workEndTime,
      faceRequired: values.faceRequired,
      gpsRequired: values.gpsRequired,
      gpsLat,
      gpsLng,
      gpsRadius,
    })
    .where(eq(tenants.id, tenant.tenantId));

  revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
  revalidatePath("/admin", "layout");

  return {
    error: null,
    fieldErrors: {},
        values: {
      ...parsed.data,
      faceRequired: values.faceRequired,
      gpsRequired: values.gpsRequired,
      gpsLat: gpsLat ?? "",
      gpsLng: gpsLng ?? "",
      gpsRadius: String(gpsRadius),
    },
    successMessage: "Pengaturan toko disimpan.",
  };
}