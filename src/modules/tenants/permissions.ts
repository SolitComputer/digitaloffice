import type { TenantContext } from "@/modules/tenants/context";

type Role = TenantContext["role"];

export function canManageMembers(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "OWNER";
}

export function canViewMembers(role: Role): boolean {
  return canManageMembers(role) || role === "MANAGER";
}