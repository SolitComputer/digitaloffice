import { z } from "zod";
import { ATTENDANCE_STATUSES, LEAVE_TYPES } from "@/db/schema";

export const setAttendanceSchema = z.object({
  userId: z.string().min(1).max(36),
  status: z.enum(ATTENDANCE_STATUSES, { error: "Status tidak valid" }),
  note: z.string().trim().max(255, "Catatan maksimal 255 karakter"),
});

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const createLeaveSchema = z
  .object({
    type: z.enum(LEAVE_TYPES, { error: "Jenis tidak valid" }),
    startDate: z.string().regex(DATE_PATTERN, "Tanggal mulai tidak valid"),
    endDate: z.string().regex(DATE_PATTERN, "Tanggal selesai tidak valid"),
    reason: z.string().trim().min(3, "Alasan minimal 3 karakter").max(255, "Alasan terlalu panjang"),
  })
  .refine((d) => d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
  });

export const decideLeaveSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().trim().max(255),
});