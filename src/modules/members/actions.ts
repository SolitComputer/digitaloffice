"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { accounts, TENANT_ROLES, tenantMembers, users, type TenantRole } from "@/db/schema";
import { isDuplicateEntryError } from "@/lib/db-errors";
import type { MemberMessageCode } from "@/modules/members/messages";
import { requireTenant, type TenantContext } from "@/modules/tenants/context";
import {
    canManageMembers,
    canManagePermissions,
    sanitizePermissions,
    serializePermissions,
} from "@/modules/tenants/permissions";
import { canManageRole } from "@/modules/tenants/roles";
import { buildCredentialUserRows } from "@/modules/users/credential";

const createMemberSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter").max(120, "Nama terlalu panjang"),
    email: z.email("Format email tidak valid"),
    role: z.enum(TENANT_ROLES, { error: "Role tidak valid" }),
    password: z.string().min(8, "Password minimal 8 karakter").max(128, "Password terlalu panjang"),
});

const updateRoleSchema = z.object({
    userId: z.string().min(1).max(36),
    role: z.enum(TENANT_ROLES),
});

const removeMemberSchema = z.object({
    userId: z.string().min(1).max(36),
});

export type CreateMemberValues = {
    name: string;
    email: string;
    role: string;
};

export type CreateMemberState = {
    error: string | null;
    fieldErrors: Record<string, string>;
    values: CreateMemberValues;
    successMessage?: string;
};

function readField(formData: FormData, key: string): string {
    return String(formData.get(key) ?? "").trim();
}

function membersPath(slug: string, message?: MemberMessageCode): string {
    const base = `/toko/${slug}/pengguna`;
    return message ? `${base}?pesan=${message}` : base;
}

async function changeMembership(
    actor: Pick<TenantContext, "tenantId" | "role">,
    userId: string,
    nextRole: TenantRole | null,
): Promise<MemberMessageCode> {
    const { tenantId } = actor;
    if (nextRole && !canManageRole(actor.role, nextRole)) return "role-lebih-tinggi";

    return db.transaction(async (tx): Promise<MemberMessageCode> => {
        const owners = await tx
            .select({ userId: tenantMembers.userId })
            .from(tenantMembers)
            .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.role, "OWNER")))
            .for("update");

        const memberFilter = and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId));
        const [target] = await tx
            .select({ role: tenantMembers.role })
            .from(tenantMembers)
            .where(memberFilter)
            .for("update");

        if (!target) return "tidak-ditemukan";
        if (!canManageRole(actor.role, target.role)) return "role-lebih-tinggi";

        const losesOwnerRole = target.role === "OWNER" && nextRole !== "OWNER";
        if (losesOwnerRole && owners.length <= 1) return "owner-terakhir";

        if (nextRole === null) {
            await tx.delete(tenantMembers).where(memberFilter);
            return "dicabut";
        }

        await tx.update(tenantMembers).set({ role: nextRole, permissions: null }).where(memberFilter);
        return "role-diubah";
    });
}

export async function createMemberAction(
    _prevState: CreateMemberState,
    formData: FormData,
): Promise<CreateMemberState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    const values: CreateMemberValues = {
        name: readField(formData, "name"),
        email: readField(formData, "email").toLowerCase(),
        role: readField(formData, "role"),
    };

    if (!canManageMembers(tenant)) {
        return { error: "Anda tidak punya akses untuk menambah pengguna.", fieldErrors: {}, values };
    }

    const parsed = createMemberSchema.safeParse({
        ...values,
        password: String(formData.get("password") ?? ""),
    });

    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] ?? "");
            if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        return { error: null, fieldErrors, values };
    }

    const data = parsed.data;
    if (!canManageRole(tenant.role, data.role)) {
        return { error: null, fieldErrors: { role: "Anda tidak bisa memberi role yang lebih tinggi dari role Anda" }, values };
    }

    const emailTakenError ={ error: null, fieldErrors: { email: "Email sudah terdaftar di DigitalOffice" }, values };

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) return emailTakenError;

    const account = await buildCredentialUserRows({
        name: data.name,
        email: data.email,
        password: data.password,
    });

    try {
        await db.transaction(async (tx) => {
            await tx.insert(users).values(account.user);
            await tx.insert(accounts).values(account.account);
            await tx.insert(tenantMembers).values({
                tenantId: tenant.tenantId,
                userId: account.userId,
                role: data.role,
            });
        });
    } catch (error) {
        if (isDuplicateEntryError(error)) return emailTakenError;
        throw error;
    }

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return {
        error: null,
        fieldErrors: {},
        values: { name: "", email: "", role: "STAFF" },
        successMessage: `${data.name} berhasil ditambahkan.`,
    };
}

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
    const tenant = await requireTenant(readField(formData, "slug"));
    if (!canManageMembers(tenant)) redirect(membersPath(tenant.tenantSlug));

    const parsed = updateRoleSchema.safeParse({
        userId: readField(formData, "userId"),
        role: readField(formData, "role"),
    });
    if (!parsed.success) redirect(membersPath(tenant.tenantSlug, "tidak-ditemukan"));
    if (parsed.data.userId === tenant.userId) redirect(membersPath(tenant.tenantSlug, "akun-sendiri"));

    const result = await changeMembership(tenant, parsed.data.userId, parsed.data.role);
    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    redirect(membersPath(tenant.tenantSlug, result));
}

export async function removeMemberAction(formData: FormData): Promise<void> {
    const tenant = await requireTenant(readField(formData, "slug"));
    if (!canManageMembers(tenant)) redirect(membersPath(tenant.tenantSlug));

    const parsed = removeMemberSchema.safeParse({ userId: readField(formData, "userId") });
    if (!parsed.success) redirect(membersPath(tenant.tenantSlug, "tidak-ditemukan"));
    if (parsed.data.userId === tenant.userId) redirect(membersPath(tenant.tenantSlug, "akun-sendiri"));

    const result = await changeMembership(tenant, parsed.data.userId, null);
    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    redirect(membersPath(tenant.tenantSlug, result));
}


const memberPermissionsSchema = z.object({
    userId: z.string().min(1).max(36),
    mode: z.enum(["default", "custom"]),
    permissions: z.array(z.string()),
});

export type MemberPermissionsState = {
    error: string | null;
    successMessage?: string;
};

export async function setMemberPermissionsAction(
    _prevState: MemberPermissionsState,
    formData: FormData,
): Promise<MemberPermissionsState> {
    const tenant = await requireTenant(readField(formData, "slug"));
    if (!canManagePermissions(tenant)) {
        return { error: "Hanya Super Admin yang bisa mengatur hak akses." };
    }

    const parsed = memberPermissionsSchema.safeParse({
        userId: readField(formData, "userId"),
        mode: readField(formData, "mode"),
        permissions: formData.getAll("permissions").map(String),
    });
    if (!parsed.success) return { error: "Data tidak valid." };

    const { userId, mode, permissions } = parsed.data;
    const memberFilter = and(eq(tenantMembers.tenantId, tenant.tenantId), eq(tenantMembers.userId, userId));

    const [member] = await db
        .select({ role: tenantMembers.role })
        .from(tenantMembers)
        .where(memberFilter)
        .limit(1);

    if (!member) return { error: "Pengguna tidak ditemukan di toko ini." };
    if (member.role === "OWNER") return { error: "Owner selalu memiliki akses penuh." };

    const stored = mode === "default" ? null : serializePermissions(sanitizePermissions(permissions));
    await db.update(tenantMembers).set({ permissions: stored }).where(memberFilter);

    revalidatePath(`/toko/${tenant.tenantSlug}`, "layout");
    return { error: null, successMessage: "Hak akses berhasil disimpan." };
}