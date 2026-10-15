import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  index?: number;
};

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card className="gap-0 py-5 transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}