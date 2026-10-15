import "server-only";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendance, faceDescriptors, leaveRequests, tenantMembers, tenants, users } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export async function getWorkStart(tenantId: string): Promise<string> {
  const [row] = await db
    .select({ workStartTime: tenants.workStartTime })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return row?.workStartTime ?? "09:00";
}

export async function getMyAttendance(ctx: TenantContext, date: string) {
  const [row] = await db
    .select({
      status: attendance.status,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      note: attendance.note,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.tenantId, ctx.tenantId),
        eq(attendance.userId, ctx.userId),
        eq(attendance.date, date),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listTodayAttendance(ctx: TenantContext, date: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      role: tenantMembers.role,
      status: attendance.status,
      checkInAt: attendance.checkInAt,
      checkOutAt: attendance.checkOutAt,
      note: attendance.note,
    })
    .from(tenantMembers)
    .innerJoin(users, eq(users.id, tenantMembers.userId))
    .leftJoin(
      attendance,
      and(
        eq(attendance.tenantId, ctx.tenantId),
        eq(attendance.userId, tenantMembers.userId),
        eq(attendance.date, date),
      ),
    )
    .where(eq(tenantMembers.tenantId, ctx.tenantId))
    .orderBy(asc(users.name));
}

export type TodayAttendanceRow = Awaited<ReturnType<typeof listTodayAttendance>>[number];

export async function listMyLeaveRequests(ctx: TenantContext, limit = 10) {
  return db
    .select({
      id: leaveRequests.id,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      decisionNote: leaveRequests.decisionNote,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.tenantId, ctx.tenantId), eq(leaveRequests.userId, ctx.userId)))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(limit);
}

export type MyLeaveRow = Awaited<ReturnType<typeof listMyLeaveRequests>>[number];

export async function listPendingLeaveRequests(ctx: TenantContext) {
  return db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      name: users.name,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      reason: leaveRequests.reason,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(and(eq(leaveRequests.tenantId, ctx.tenantId), eq(leaveRequests.status, "PENDING")))
    .orderBy(asc(leaveRequests.startDate));
}

export type PendingLeaveRow = Awaited<ReturnType<typeof listPendingLeaveRequests>>[number];

export async function getMonthlyRecap(ctx: TenantContext, month: string) {
  const start = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const next = m >= 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const count = (status: string) =>
    sql<number>`sum(case when ${attendance.status} = ${status} then 1 else 0 end)`.mapWith(Number);

  return db
    .select({
      userId: users.id,
      name: users.name,
      role: tenantMembers.role,
      hadir: count("HADIR"),
      telat: count("TELAT"),
      izin: count("IZIN"),
      sakit: count("SAKIT"),
      alpha: count("ALPHA"),
      libur: count("LIBUR"),
    })
    .from(tenantMembers)
    .innerJoin(users, eq(users.id, tenantMembers.userId))
    .leftJoin(
      attendance,
      and(
        eq(attendance.tenantId, ctx.tenantId),
        eq(attendance.userId, tenantMembers.userId),
        gte(attendance.date, start),
        lt(attendance.date, next),
      ),
    )
    .where(eq(tenantMembers.tenantId, ctx.tenantId))
    .groupBy(users.id, users.name, tenantMembers.role)
    .orderBy(asc(users.name));
}

export type MonthlyRecapRow = Awaited<ReturnType<typeof getMonthlyRecap>>[number];

export async function hasRegisteredFace(ctx: TenantContext): Promise<boolean> {
  const rows = await db
    .select({ id: faceDescriptors.id })
    .from(faceDescriptors)
    .where(and(eq(faceDescriptors.tenantId, ctx.tenantId), eq(faceDescriptors.userId, ctx.userId)))
    .limit(1);

  return rows.length > 0;
}

export async function getGpsRequired(ctx: TenantContext): Promise<boolean> {
  const [row] = await db
    .select({ gpsRequired: tenants.gpsRequired })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);
  return row?.gpsRequired ?? false;
}