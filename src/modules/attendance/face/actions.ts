"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { faceDescriptors } from "@/db/schema/attendance";
import { requireTenant } from "@/modules/tenants/context";

type ActionResult = { error?: string; success?: boolean };

export async function registerFaceAction(
  slug: string,
  descriptor: number[],
): Promise<ActionResult> {
  const tenant = await requireTenant(slug);

  const valid =
    Array.isArray(descriptor) &&
    descriptor.length === 128 &&
    descriptor.every((n) => typeof n === "number" && Number.isFinite(n));

  if (!valid) {
    return { error: "Data wajah tidak valid. Coba ulangi pendaftaran." };
  }

  const payload = JSON.stringify(descriptor);

  const existing = await db
    .select({ id: faceDescriptors.id })
    .from(faceDescriptors)
    .where(
      and(
        eq(faceDescriptors.tenantId, tenant.tenantId),
        eq(faceDescriptors.userId, tenant.userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(faceDescriptors)
      .set({ descriptor: payload })
      .where(eq(faceDescriptors.id, existing[0].id));
  } else {
    await db.insert(faceDescriptors).values({
      id: crypto.randomUUID(),
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      descriptor: payload,
    });
  }

  revalidatePath(`/toko/${slug}/absensi`);
  return { success: true };
}