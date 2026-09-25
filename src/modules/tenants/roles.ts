import type { TenantRole } from "@/db/schema";

export const ROLE_LABELS: Record<TenantRole | "SUPER_ADMIN", string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  KASIR: "Kasir",
  STAFF: "Staff",
};