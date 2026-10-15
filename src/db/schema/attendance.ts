import {
  boolean,
  date,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./auth";
import { tenants } from "./tenants";

export const ATTENDANCE_STATUSES = ["HADIR", "TELAT", "IZIN", "SAKIT", "ALPHA", "LIBUR"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const attendance = mysqlTable(
  "attendance",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(), // "YYYY-MM-DD" (tanggal WIB)
    status: mysqlEnum("status", ATTENDANCE_STATUSES).notNull(),
    faceVerified: boolean("face_verified").notNull().default(false),
    checkInLat: varchar("check_in_lat", { length: 32 }),
    checkInLng: varchar("check_in_lng", { length: 32 }),
    checkInAt: timestamp("check_in_at"),
    checkOutAt: timestamp("check_out_at"),
    checkOutLat: varchar("check_out_lat", { length: 32 }),
    checkOutLng: varchar("check_out_lng", { length: 32 }),
    note: varchar("note", { length: 255 }), // alasan izin/sakit atau catatan admin
    createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // null = absen sendiri
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    // 1 record per karyawan per hari
    uniqueIndex("attendance_tenant_user_date_uq").on(t.tenantId, t.userId, t.date),
    index("attendance_tenant_date_idx").on(t.tenantId, t.date),
  ],
);

export const LEAVE_TYPES = ["IZIN", "SAKIT"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const leaveRequests = mysqlTable(
  "leave_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", LEAVE_TYPES).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    status: mysqlEnum("status", LEAVE_STATUSES).notNull().default("PENDING"),
    decidedBy: varchar("decided_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    decisionNote: varchar("decision_note", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("leave_requests_tenant_status_idx").on(t.tenantId, t.status),
    index("leave_requests_tenant_user_idx").on(t.tenantId, t.userId),
  ],
);

export const faceDescriptors = mysqlTable(
  "face_descriptors",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    descriptor: text("descriptor").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("face_descriptors_tenant_user_uq").on(t.tenantId, t.userId)],
);