import { TENANT_ROLES, type TenantRole } from "@/db/schema";

type ActorRole = TenantRole | "SUPER_ADMIN";

export const ROLE_LABELS: Record<ActorRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  KASIR: "Kasir",
  STAFF: "Staff",
};

const ROLE_RANK: Record<ActorRole, number> = {
  SUPER_ADMIN: 5,
  OWNER: 4,
  MANAGER: 3,
  KASIR: 2,
  STAFF: 1,
};

export function canManageRole(actorRole: ActorRole, targetRole: TenantRole): boolean {
  return ROLE_RANK[actorRole] >= ROLE_RANK[targetRole];
}

export function getAssignableRoles(actorRole: ActorRole): TenantRole[] {
  return TENANT_ROLES.filter((role) => canManageRole(actorRole, role));
}
