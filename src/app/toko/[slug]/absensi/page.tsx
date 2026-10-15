import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireTenant } from "@/modules/tenants/context";
import { canManageAttendance, hasPermission } from "@/modules/tenants/permissions";
import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    getGpsRequired,
    getMyAttendance,
    hasRegisteredFace,
    listMyLeaveRequests,
    listPendingLeaveRequests,
    listTodayAttendance,
} from "@/modules/attendance/queries";
import { jakartaNow } from "@/modules/attendance/time";
import { ClockCard } from "@/modules/attendance/components/clock-card";
import { AttendanceAdminTable } from "@/modules/attendance/components/attendance-admin-table";
import { LeaveRequestDialog } from "@/modules/attendance/components/leave-request-dialog";
import { MyLeaveList } from "@/modules/attendance/components/my-leave-list";
import { LeaveApprovalList } from "@/modules/attendance/components/leave-approval-list";
import { FaceRegister } from "@/modules/attendance/face/face-register";

export const metadata: Metadata = {
    title: "Absensi | DigitalOffice",
};

type AbsensiPageProps = {
    params: Promise<{ slug: string }>;
};

export default async function AbsensiPage({ params }: AbsensiPageProps) {
    const { slug } = await params;
    const tenant = await requireTenant(slug);
    const faceRegistered = await hasRegisteredFace(tenant);
    const gpsRequired = await getGpsRequired(tenant);
    if (!hasPermission(tenant, "attendance.view")) notFound();

    const { date } = jakartaNow();
    const canManage = canManageAttendance(tenant);

    const [mine, myLeaves, todayRows, pending] = await Promise.all([
        getMyAttendance(tenant, date),
        listMyLeaveRequests(tenant),
        canManage ? listTodayAttendance(tenant, date) : Promise.resolve([]),
        canManage ? listPendingLeaveRequests(tenant) : Promise.resolve([]),
    ]);

    const todayLabel = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date());

    return (
        <>
            <PageHeader
                title="Absensi"
                description={todayLabel}
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canManage ? (
                            <Button asChild variant="outline">
                                <Link href={`/toko/${tenant.tenantSlug}/absensi/rekap`}>
                                    <CalendarRange className="size-4" />
                                    Rekap Bulanan
                                </Link>
                            </Button>
                        ) : null}
                        <LeaveRequestDialog slug={tenant.tenantSlug} defaultDate={date} />
                    </div>
                }
            />

            <div className="mb-8 flex flex-col gap-4">
                <FaceRegister slug={tenant.tenantSlug} alreadyRegistered={faceRegistered} />
                <ClockCard
                    slug={tenant.tenantSlug}
                    status={mine?.status ?? null}
                    checkInAt={mine?.checkInAt ?? null}
                    checkOutAt={mine?.checkOutAt ?? null}
                    faceRegistered={faceRegistered}
                    gpsRequired={gpsRequired}
                />
            </div>

            {canManage ? (
                <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold tracking-tight">
                        Menunggu Persetujuan {pending.length > 0 ? `(${pending.length})` : ""}
                    </h2>
                    <LeaveApprovalList
                        slug={tenant.tenantSlug}
                        rows={pending}
                        currentUserId={tenant.userId}
                        canSelfApprove={tenant.role === "OWNER" || tenant.role === "SUPER_ADMIN"}
                    />
                </section>
            ) : null}

            {canManage ? (
                <section className="mb-8">
                    <h2 className="mb-3 text-lg font-semibold tracking-tight">Kehadiran Karyawan Hari Ini</h2>
                    <AttendanceAdminTable slug={tenant.tenantSlug} rows={todayRows} />
                </section>
            ) : null}

            <section>
                <h2 className="mb-3 text-lg font-semibold tracking-tight">Riwayat Izin/Sakit Saya</h2>
                <MyLeaveList rows={myLeaves} />
            </section>
        </>
    );
}