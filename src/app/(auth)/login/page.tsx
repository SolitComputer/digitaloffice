import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/modules/auth/components/login-form";
import { getSession } from "@/modules/auth/session";
import { resolveHomePath } from "@/modules/tenants/queries";

export const metadata: Metadata = {
  title: "Masuk | DigitalOffice",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(await resolveHomePath(session.user.id));

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold tracking-tight">DigitalOffice</p>
          <p className="text-sm text-muted-foreground">Kelola toko Anda dalam satu tempat</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Masuk</CardTitle>
            <CardDescription>Gunakan email dan password dari admin toko Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}