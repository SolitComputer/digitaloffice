import type { AttendanceStatus } from "@/db/schema";
import type { LeaveStatus, LeaveType } from "@/db/schema";


export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  TELAT: "Telat",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPHA: "Alpha",
  LIBUR: "Libur",
};

export const ATTENDANCE_STATUS_VARIANTS: Record<
  AttendanceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  HADIR: "default",
  TELAT: "secondary",
  IZIN: "outline",
  SAKIT: "outline",
  ALPHA: "destructive",
  LIBUR: "secondary",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = { IZIN: "Izin", SAKIT: "Sakit" };
export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};
export const LEAVE_STATUS_VARIANTS: Record<LeaveStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};