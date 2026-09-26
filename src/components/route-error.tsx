"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export function RouteError({ error, retry }: RouteErrorProps) {
  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Halaman gagal dimuat</h2>
          <p className="text-sm text-muted-foreground">
            Terjadi kesalahan saat memuat data. Silakan coba lagi beberapa saat.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">Kode: {error.digest}</p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => retry()}>
          <RotateCw className="size-4" />
          Coba lagi
        </Button>
      </CardContent>
    </Card>
  );
}
