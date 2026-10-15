"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { attendance, faceDescriptors, leaveRequests, tenants } from "@/db/schema";
import { requireTenant } from "@/modules/tenants/context";
import { canManageAttendance, hasPermission } from "@/modules/tenants/permissions";
import { getWorkStart } from "@/modules/attendance/queries";
import { createLeaveSchema, decideLeaveSchema, setAttendanceSchema } from "@/modules/attendance/schemas";
import { enumerateDates, jakartaNow } from "@/modules/attendance/time";
import { euclideanDistance, FACE_MATCH_THRESHOLD } from "@/modules/attendance/face/match";
import { haversineMeters } from "@/modules/attendance/geo";

export type AttendanceActionState = { error: string | null; successMessage?: string };

function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function clockInAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!hasPermission(tenant, "attendance.view")) return { error: "Anda tidak punya akses absensi." };

  // --- Verifikasi wajah ---
  const [face] = await db
    .select({ descriptor: faceDescriptors.descriptor })
    .from(faceDescriptors)
    .where(and(eq(faceDescriptors.tenantId, tenant.tenantId), eq(faceDescriptors.userId, tenant.userId)))
    .limit(1);

  let faceVerified = false;

  if (face) {
    // Sudah daftar wajah → wajib cocok
    let live: unknown;
    let stored: unknown;
    try {
      live = JSON.parse(readField(formData, "faceDescriptor"));
    } catch {
      return { error: "Verifikasi wajah gagal terbaca. Coba lagi." };
    }
    try {
      stored = JSON.parse(face.descriptor);
    } catch {
      return { error: "Data wajah rusak. Daftar ulang wajah dulu di kartu Registrasi Wajah." };
    }
    if (!Array.isArray(live) || live.length !== 128) {
      return { error: "Wajah tidak terbaca. Hadapkan wajah ke kamera lalu coba lagi." };
    }
    const distance = euclideanDistance(live as number[], stored as number[]);
    if (distance >= FACE_MATCH_THRESHOLD) {
      return { error: "Wajah tidak cocok dengan yang terdaftar. Coba lagi." };
    }
    faceVerified = true;
  } else {
    // Belum daftar wajah → cek apakah toko mewajibkan
    const [t] = await db
      .select({ faceRequired: tenants.faceRequired })
      .from(tenants)
      .where(eq(tenants.id, tenant.tenantId))
      .limit(1);
    if (t?.faceRequired) {
      return { error: "Kamu harus daftar wajah dulu sebelum bisa absen." };
    }
  }

  // --- Verifikasi lokasi GPS ---
  let checkInLat: string | null = null;
  let checkInLng: string | null = null;

  const [geo] = await db
    .select({
      gpsRequired: tenants.gpsRequired,
      gpsLat: tenants.gpsLat,
      gpsLng: tenants.gpsLng,
      gpsRadius: tenants.gpsRadius,
    })
    .from(tenants)
    .where(eq(tenants.id, tenant.tenantId))
    .limit(1);

  const userLat = Number(readField(formData, "lat"));
  const userLng = Number(readField(formData, "lng"));
  const accuracy = Number(readField(formData, "acc"));
  const hasUserPos = Number.isFinite(userLat) && Number.isFinite(userLng);

  if (geo?.gpsRequired) {
    if (!geo.gpsLat || !geo.gpsLng) {
      return { error: "Titik lokasi toko belum diatur admin. Hubungi admin." };
    }
    if (!hasUserPos) {
      return { error: "Lokasi kamu tidak terbaca. Aktifkan izin lokasi lalu coba lagi." };
    }
    if (Number.isFinite(accuracy) && accuracy > 1000) {
      return { error: "Sinyal GPS lemah (lokasi tidak akurat). Aktifkan GPS presisi di HP, lalu coba lagi." };
    }

    const distance = haversineMeters(Number(geo.gpsLat), Number(geo.gpsLng), userLat, userLng);
    const margin = Number.isFinite(accuracy) ? accuracy : 0;
    if (distance - margin > geo.gpsRadius) {
      return {
        error: `Kamu di luar area toko (±${Math.round(distance)} m dari toko, batas ${geo.gpsRadius} m). Absen harus dari lokasi toko.`,
      };
    }
    checkInLat = String(userLat);
    checkInLng = String(userLng);
  } else if (hasUserPos) {
    // GPS tidak wajib: tetap simpan lokasi kalau dikirim (buat catatan).
    checkInLat = String(userLat);
    checkInLng = String(userLng);
  }

  const { date, time } = jakartaNow();
  const workStart = await getWorkStart(tenant.tenantId);
  const status = time > workStart ? "TELAT" : "HADIR";

  const filter = and(
    eq(attendance.tenantId, tenant.tenantId),
    eq(attendance.userId, tenant.userId),
    eq(attendance.date, date),
  );
  const [existing] = await db
    .select({ id: attendance.id, checkInAt: attendance.checkInAt })
    .from(attendance)
    .where(filter)
    .limit(1);

  if (existing?.checkInAt) return { error: "Kamu sudah absen masuk hari ini." };

  if (existing) {
    await db
      .update(attendance)
      .set({ status, checkInAt: new Date(), faceVerified, checkInLat, checkInLng })
      .where(eq(attendance.id, existing.id));
  } else {
    await db.insert(attendance).values({
      id: crypto.randomUUID(),
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      date,
      status,
      checkInAt: new Date(),
      faceVerified,
      checkInLat,
      checkInLng,
    });
  }

  revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
  return {
    error: null,
    successMessage: status === "TELAT" ? "Absen masuk tercatat — status Telat." : "Absen masuk tercatat. Selamat bekerja!",
  };
}

export async function clockOutAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!hasPermission(tenant, "attendance.view")) return { error: "Anda tidak punya akses absensi." };

  const { date } = jakartaNow();
  const filter = and(
    eq(attendance.tenantId, tenant.tenantId),
    eq(attendance.userId, tenant.userId),
    eq(attendance.date, date),
  );
  const [existing] = await db
    .select({ id: attendance.id, checkInAt: attendance.checkInAt, checkOutAt: attendance.checkOutAt })
    .from(attendance)
    .where(filter)
    .limit(1);

  if (!existing?.checkInAt) return { error: "Kamu belum absen masuk hari ini." };
  if (existing.checkOutAt) return { error: "Kamu sudah absen pulang hari ini." };

  // --- Verifikasi wajah (kalau sudah daftar) ---
  const [face] = await db
    .select({ descriptor: faceDescriptors.descriptor })
    .from(faceDescriptors)
    .where(and(eq(faceDescriptors.tenantId, tenant.tenantId), eq(faceDescriptors.userId, tenant.userId)))
    .limit(1);

  if (face) {
    let live: unknown;
    let stored: unknown;
    try {
      live = JSON.parse(readField(formData, "faceDescriptor"));
    } catch {
      return { error: "Verifikasi wajah gagal terbaca. Coba lagi." };
    }
    try {
      stored = JSON.parse(face.descriptor);
    } catch {
      return { error: "Data wajah rusak. Daftar ulang wajah dulu." };
    }
    if (!Array.isArray(live) || live.length !== 128) {
      return { error: "Wajah tidak terbaca. Hadapkan wajah ke kamera lalu coba lagi." };
    }
    if (euclideanDistance(live as number[], stored as number[]) >= FACE_MATCH_THRESHOLD) {
      return { error: "Wajah tidak cocok dengan yang terdaftar. Coba lagi." };
    }
  }

  // --- Verifikasi lokasi GPS ---
  let checkOutLat: string | null = null;
  let checkOutLng: string | null = null;

  const [geo] = await db
    .select({
      gpsRequired: tenants.gpsRequired,
      gpsLat: tenants.gpsLat,
      gpsLng: tenants.gpsLng,
      gpsRadius: tenants.gpsRadius,
    })
    .from(tenants)
    .where(eq(tenants.id, tenant.tenantId))
    .limit(1);

  const userLat = Number(readField(formData, "lat"));
  const userLng = Number(readField(formData, "lng"));
  const accuracy = Number(readField(formData, "acc"));
  const hasUserPos = Number.isFinite(userLat) && Number.isFinite(userLng);

  if (geo?.gpsRequired) {
    if (!geo.gpsLat || !geo.gpsLng) {
      return { error: "Titik lokasi toko belum diatur admin. Hubungi admin." };
    }
    if (!hasUserPos) {
      return { error: "Lokasi kamu tidak terbaca. Aktifkan izin lokasi lalu coba lagi." };
    }
    if (Number.isFinite(accuracy) && accuracy > 1000) {
      return { error: "Sinyal GPS lemah (lokasi tidak akurat). Aktifkan GPS presisi di HP, lalu coba lagi." };
    }
    const distance = haversineMeters(Number(geo.gpsLat), Number(geo.gpsLng), userLat, userLng);
    const margin = Number.isFinite(accuracy) ? accuracy : 0;
    if (distance - margin > geo.gpsRadius) {
      return {
        error: `Kamu di luar area toko (±${Math.round(distance)} m dari toko, batas ${geo.gpsRadius} m). Absen harus dari lokasi toko.`,
      };
    }
    checkOutLat = String(userLat);
    checkOutLng = String(userLng);
  } else if (hasUserPos) {
    checkOutLat = String(userLat);
    checkOutLng = String(userLng);
  }

  await db
    .update(attendance)
    .set({ checkOutAt: new Date(), checkOutLat, checkOutLng })
    .where(eq(attendance.id, existing.id));
  revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
  return { error: null, successMessage: "Absen pulang tercatat. Hati-hati di jalan!" };
}

export async function setAttendanceAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageAttendance(tenant)) return { error: "Anda tidak punya akses mengelola absensi." };

  const parsed = setAttendanceSchema.safeParse({
    userId: readField(formData, "userId"),
    status: readField(formData, "status"),
    note: readField(formData, "note"),
  });
  if (!parsed.success) return { error: "Data tidak valid." };

  const { userId, status, note } = parsed.data;
  const { date } = jakartaNow();
  const filter = and(
    eq(attendance.tenantId, tenant.tenantId),
    eq(attendance.userId, userId),
    eq(attendance.date, date),
  );
  const [existing] = await db.select({ id: attendance.id }).from(attendance).where(filter).limit(1);

  if (existing) {
    await db.update(attendance).set({ status, note: note || null, createdBy: tenant.userId }).where(eq(attendance.id, existing.id));
  } else {
    await db.insert(attendance).values({
      id: crypto.randomUUID(),
      tenantId: tenant.tenantId,
      userId,
      date,
      status,
      note: note || null,
      createdBy: tenant.userId,
    });
  }

  revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
  return { error: null, successMessage: "Absensi karyawan diperbarui." };
}

export type LeaveRequestState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: { type: string; startDate: string; endDate: string; reason: string };
  successMessage?: string;
};

export async function createLeaveRequestAction(
  _prev: LeaveRequestState,
  formData: FormData,
): Promise<LeaveRequestState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  const values = {
    type: readField(formData, "type"),
    startDate: readField(formData, "startDate"),
    endDate: readField(formData, "endDate"),
    reason: readField(formData, "reason"),
  };

  if (!hasPermission(tenant, "attendance.view")) {
    return { error: "Anda tidak punya akses absensi.", fieldErrors: {}, values };
  }

  const parsed = createLeaveSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: null, fieldErrors, values };
  }

  const data = parsed.data;
  if (enumerateDates(data.startDate, data.endDate).length > 60) {
    return { error: "Rentang maksimal 60 hari.", fieldErrors: {}, values };
  }

  await db.insert(leaveRequests).values({
    id: crypto.randomUUID(),
    tenantId: tenant.tenantId,
    userId: tenant.userId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
  });

  revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
  return {
    error: null,
    fieldErrors: {},
    values: { type: "IZIN", startDate: "", endDate: "", reason: "" },
    successMessage: "Pengajuan terkirim, menunggu persetujuan.",
  };
}

export async function decideLeaveRequestAction(
  _prev: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const tenant = await requireTenant(readField(formData, "slug"));
  if (!canManageAttendance(tenant)) return { error: "Anda tidak punya akses menyetujui izin." };

  const parsed = decideLeaveSchema.safeParse({
    requestId: readField(formData, "requestId"),
    decision: readField(formData, "decision"),
    decisionNote: readField(formData, "decisionNote"),
  });
  if (!parsed.success) return { error: "Data tidak valid." };

  const { requestId, decision, decisionNote } = parsed.data;
  const [req] = await db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
    })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.tenantId, tenant.tenantId), eq(leaveRequests.id, requestId)))
    .limit(1);

  if (!req) return { error: "Pengajuan tidak ditemukan." };
  if (req.status !== "PENDING") return { error: "Pengajuan sudah diproses." };

  // Hanya Kepala Toko (OWNER) & Super Admin yang boleh menyetujui pengajuannya sendiri.
  const bosSendiri = tenant.role === "OWNER" || tenant.role === "SUPER_ADMIN";
  if (req.userId === tenant.userId && !bosSendiri) {
    return { error: "Anda tidak bisa menyetujui pengajuan sendiri. Minta atasan yang menyetujui." };
  }

  if (decision === "REJECTED") {
    await db
      .update(leaveRequests)
      .set({ status: "REJECTED", decidedBy: tenant.userId, decidedAt: new Date(), decisionNote: decisionNote || null })
      .where(eq(leaveRequests.id, req.id));
    revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
    return { error: null, successMessage: "Pengajuan ditolak." };
  }

  const dates = enumerateDates(req.startDate, req.endDate);
  await db.transaction(async (tx) => {
    await tx
      .update(leaveRequests)
      .set({ status: "APPROVED", decidedBy: tenant.userId, decidedAt: new Date(), decisionNote: decisionNote || null })
      .where(eq(leaveRequests.id, req.id));

    for (const d of dates) {
      const filter = and(
        eq(attendance.tenantId, tenant.tenantId),
        eq(attendance.userId, req.userId),
        eq(attendance.date, d),
      );
      const [existing] = await tx.select({ id: attendance.id }).from(attendance).where(filter).limit(1);
      if (existing) {
        await tx.update(attendance).set({ status: req.type, note: req.reason, createdBy: tenant.userId }).where(eq(attendance.id, existing.id));
      } else {
        await tx.insert(attendance).values({
          id: crypto.randomUUID(),
          tenantId: tenant.tenantId,
          userId: req.userId,
          date: d,
          status: req.type,
          note: req.reason,
          createdBy: tenant.userId,
        });
      }
    }
  });

  revalidatePath(`/toko/${tenant.tenantSlug}/absensi`);
  return { error: null, successMessage: "Pengajuan disetujui." };
}