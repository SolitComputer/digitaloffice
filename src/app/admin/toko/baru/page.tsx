import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireSuperAdmin } from "@/modules/auth/session";
import { CreateTenantForm } from "@/modules/platform/components/create-tenant-form";

export const metadata: Metadata = {
  title: "Tambah Toko | DigitalOffice",
};

export default async function NewTenantPage() {
  await requireSuperAdmin();

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Tambah Toko"
        description="Daftarkan toko baru beserta akun owner-nya."
      />
      <Card>
        <CardContent>
          <CreateTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}