import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { TwoFactorChallengeForm } from "@/modules/auth/components/two-factor-challenge-form";
import { getSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = {
    title: "Verifikasi 2FA | DigitalOffice",
};

export default async function TwoFactorChallengePage() {
    const session = await getSession();
    if (session) redirect(await resolveHomePath(session.user.id));

    return (
        <AuthShell>
            <Card>
                <CardHeader>
                    <CardTitle>Verifikasi Dua Langkah</CardTitle>
                    <CardDescription>
                        Buka aplikasi authenticator di HP Anda, lalu masukkan kode yang tampil.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TwoFactorChallengeForm />
                </CardContent>
            </Card>
            <Link
                href="/login"
                className="block text-center text-sm text-muted-foreground hover:text-foreground"
            >
                ← Kembali ke login
            </Link>
        </AuthShell>
    );
}