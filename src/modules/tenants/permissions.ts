import type { StockMovementType, TenantRole } from "@/db/schema";
import type { TenantContext } from "@/modules/tenants/context";

export const PERMISSION_GROUPS = [
  {
    label: "Inventory",
    permissions: [
      { key: "inventory.view", label: "Lihat produk & stok" },
      { key: "inventory.stock", label: "Catat stok masuk / keluar" },
      { key: "inventory.manage", label: "Tambah, edit, arsip produk & stok opname" },
    ],
  },
  {
    label: "Pengguna",
    permissions: [
      { key: "members.view", label: "Lihat daftar pengguna" },
      { key: "members.manage", label: "Tambah pengguna, ubah role & cabut akses" },
    ],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
);

const ROLE_DEFAULT_PERMISSIONS: Record<TenantRole, readonly Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  MANAGER: ["inventory.view", "inventory.stock", "inventory.manage", "members.view"],
  KASIR: ["inventory.view", "inventory.stock"],
  STAFF: ["inventory.view"],
};

function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

export function sanitizePermissions(values: readonly string[]): Permission[] {
  return [...new Set(values.map((value) => value.trim()).filter(isPermission))];
}

export function parseStoredPermissions(stored: string | null): Permission[] | null {
  if (stored === null) return null;
  return sanitizePermissions(stored.split(","));
}

export function serializePermissions(permissions: readonly Permission[]): string {
  return [...permissions].sort().join(",");
}

export function getDefaultPermissions(role: TenantRole): readonly Permission[] {
  return ROLE_DEFAULT_PERMISSIONS[role];
}

export function resolvePermissions(
  role: TenantContext["role"],
  stored: string | null,
): ReadonlySet<Permission> {
  if (role === "SUPER_ADMIN" || role === "OWNER") return new Set(ALL_PERMISSIONS);
  return new Set(parseStoredPermissions(stored) ?? ROLE_DEFAULT_PERMISSIONS[role]);
}

type PermissionHolder = Pick<TenantContext, "permissions" | "isSuspended">;

function isReadPermission(permission: Permission): boolean {
  return permission.endsWith(".view");
}

export function hasPermission(ctx: PermissionHolder, permission: Permission): boolean {
  if (ctx.isSuspended && !isReadPermission(permission)) return false;
  return ctx.permissions.has(permission);
}

export function canViewMembers(ctx: PermissionHolder): boolean {
  return hasPermission(ctx, "members.view");
}

export function canManageMembers(ctx: PermissionHolder): boolean {
  return hasPermission(ctx, "members.manage");
}

export function canManageProducts(ctx: PermissionHolder): boolean {
  return hasPermission(ctx, "inventory.manage");
}

export function getAllowedMovementTypes(ctx: PermissionHolder): StockMovementType[] {
  const types: StockMovementType[] = [];
  if (hasPermission(ctx, "inventory.stock")) types.push("IN", "OUT");
  if (canManageProducts(ctx)) types.push("ADJUST");
  return types;
}

export function canManagePermissions(ctx: Pick<TenantContext, "role" | "isSuspended">): boolean {
  return ctx.role === "SUPER_ADMIN" && !ctx.isSuspended;
}