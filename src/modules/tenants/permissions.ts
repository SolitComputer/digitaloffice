import type { StockMovementType, TenantRole } from "@/db/schema"; 
import type { TenantContext } from "@/modules/tenants/context";

export const PERMISSION_GROUPS = [
  {
    label: "Akses Halaman",
    description: "Halaman yang boleh dibuka. Kalau dimatikan, menu hilang dari sidebar.",
    permissions: [
      { key: "inventory.view", label: "Inventory" },
      { key: "members.view", label: "Pengguna" },
      { key: "settings.view", label: "Pengaturan" },
    ],
  },
  {
    label: "Inventory",
    description: "Aksi di halaman Inventory.",
    permissions: [
      { key: "inventory.stock", label: "Catat stok masuk / keluar", requires: "inventory.view" },
      { key: "inventory.manage", label: "Tambah, edit & arsip produk", requires: "inventory.view" },
    ],
  },
  {
    label: "Pengguna",
    description: "Aksi di halaman Pengguna.",
    permissions: [
      { key: "members.manage", label: "Tambah pengguna, ubah role & cabut akses", requires: "members.view" },
    ],
  },
  {
    label: "Pengaturan",
    description: "Aksi di halaman Pengaturan.",
    permissions: [
      { key: "settings.manage", label: "Ubah profil & pengaturan toko", requires: "settings.view" },
    ],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

function collectPermissions(): Permission[] {
  const keys: Permission[] = [];
  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) keys.push(permission.key);
  }
  return keys;
}

function collectRequirements(): Partial<Record<Permission, Permission>> {
  const map: Partial<Record<Permission, Permission>> = {};
  for (const group of PERMISSION_GROUPS) {
    for (const permission of group.permissions) {
      if ("requires" in permission) map[permission.key] = permission.requires;
    }
  }
  return map;
}

export const ALL_PERMISSIONS: readonly Permission[] = collectPermissions();
export const PERMISSION_REQUIREMENTS = collectRequirements();

export function getDependentPermissions(permission: Permission): Permission[] {
  return ALL_PERMISSIONS.filter((candidate) => PERMISSION_REQUIREMENTS[candidate] === permission);
}

const ROLE_DEFAULT_PERMISSIONS: Record<TenantRole, readonly Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  MANAGER: ["inventory.view", "inventory.stock", "inventory.manage", "members.view", "settings.view"],
  KASIR: ["inventory.view", "inventory.stock"],
  STAFF: ["inventory.view"],
};

function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

function applyRequirements(permissions: Iterable<Permission>): Set<Permission> {
  const result = new Set(permissions);
  for (const permission of [...result]) {
    const required = PERMISSION_REQUIREMENTS[permission];
    if (required && !result.has(required)) result.delete(permission);
  }
  return result;
}

export function sanitizePermissions(values: readonly string[]): Permission[] {
  const valid = values.map((value) => value.trim()).filter(isPermission);
  return [...applyRequirements(valid)];
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
  return applyRequirements(parseStoredPermissions(stored) ?? ROLE_DEFAULT_PERMISSIONS[role]);
}

type PermissionHolder = Pick<TenantContext, "permissions">;

export function hasPermission(ctx: PermissionHolder, permission: Permission): boolean {
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
  if (hasPermission(ctx, "inventory.manage")) types.push("ADJUST");
  return types;
}

export function canManagePermissions(ctx: Pick<TenantContext, "role">): boolean {
  return ctx.role === "SUPER_ADMIN";
}