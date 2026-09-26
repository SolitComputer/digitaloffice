import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreateMemberDialog } from "@/modules/members/components/create-member-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { readParam } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { MemberRowActions } from "@/modules/members/components/member-row-actions";
import { getMemberMessage } from "@/modules/members/messages";
import { listMembers } from "@/modules/members/queries";
import { requireTenant } from "@/modules/tenants/context";
import {
    canManageMembers,
    canManagePermissions,
    canViewMembers,
    getDefaultPermissions,
    parseStoredPermissions,
} from "@/modules/tenants/permissions";
import { MemberPermissionsDialog } from "@/modules/members/components/member-permissions-dialog";
import { canManageRole, getAssignableRoles, ROLE_LABELS } from "@/modules/tenants/roles";

export const metadata: Metadata = {
    title: "Pengguna | DigitalOffice",
};

type MembersPageProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ params, searchParams }: MembersPageProps) {
    const [{ slug }, query] = await Promise.all([params, searchParams]);
    const tenant = await requireTenant(slug);
    if (!canViewMembers(tenant)) notFound();

    const canManage = canManageMembers(tenant);
    const canEditPermissions = canManagePermissions(tenant);
    const roleOptions = getAssignableRoles(tenant.role).map((role) => ({ value: role, label: ROLE_LABELS[role] }));
    const members = await listMembers(tenant);
    const message = getMemberMessage(readParam(query.pesan));

    return (
        <>
            <PageHeader
                title="Pengguna"
                description={`${members.length} orang memiliki akses ke ${tenant.tenantName}.`}
                actions={
                    canManage ? (
                        <CreateMemberDialog
                            slug={tenant.tenantSlug}
                            tenantName={tenant.tenantName}
                            roleOptions={roleOptions}
                        />
                    ) : undefined
                }
            />

            {message ? (
                <div
                    role={message.tone === "error" ? "alert" : "status"}
                    className={cn(
                        "mb-4 rounded-md border px-4 py-3 text-sm",
                        message.tone === "error" ? "border-destructive/50 text-destructive" : "bg-background",
                    )}
                >
                    {message.text}
                </div>
            ) : null}

            <Card className="overflow-hidden py-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Bergabung</TableHead>
                                {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManage ? 4 : 3} className="py-10 text-center text-muted-foreground">
                                        Belum ada pengguna.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => {
                                    const isSelf = member.userId === tenant.userId;
                                    const isLocked = isSelf || !canManageRole(tenant.role, member.role);

                                    return (
                                        <TableRow key={member.userId}>
                                            <TableCell>
                                                <p className="font-medium">
                                                    {member.name}
                                                    {isSelf ? (
                                                        <Badge variant="outline" className="ml-2">
                                                            Anda
                                                        </Badge>
                                                    ) : null}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                                                    {member.permissions !== null && member.role !== "OWNER" ? (
                                                        <Badge variant="outline">Akses khusus</Badge>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(member.joinedAt)}</TableCell>
                                            {canManage ? (
                                                <TableCell>
                                                    {isLocked ? (
                                                        <p className="text-right text-xs text-muted-foreground">—</p>
                                                    ) : (
                                                        <MemberRowActions
                                                            slug={tenant.tenantSlug}
                                                            userId={member.userId}
                                                            name={member.name}
                                                            role={member.role}
                                                            roleOptions={roleOptions}
                                                            extraAction={
                                                                canEditPermissions && member.role !== "OWNER" ? (
                                                                    <MemberPermissionsDialog
                                                                        slug={tenant.tenantSlug}
                                                                        userId={member.userId}
                                                                        name={member.name}
                                                                        roleLabel={ROLE_LABELS[member.role]}
                                                                        defaultPermissions={[...getDefaultPermissions(member.role)]}
                                                                        customPermissions={parseStoredPermissions(member.permissions)}
                                                                    />
                                                                ) : null
                                                            }
                                                        />
                                                    )}
                                                </TableCell>
                                            ) : null}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </>
    );
}