import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">DigitalOffice</CardTitle>
          <CardDescription>
            Inventory, absensi, cashflow, dan manajemen user untuk toko Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Masuk</Button>
          <Button variant="outline">Pelajari</Button>
        </CardContent>
      </Card>
    </main>
  );
}