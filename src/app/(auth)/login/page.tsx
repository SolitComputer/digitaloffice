import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
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
    <AuthShell>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Selamat datang kembali</CardTitle>
          <CardDescription>Masuk dengan email dan password dari admin toko Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DigitalOffice
      </p>
    </AuthShell>
  );
}