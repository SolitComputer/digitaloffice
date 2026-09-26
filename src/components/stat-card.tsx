import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  index?: number;
};

export function StatCard({ label, value, hint, icon, index = 0 }: StatCardProps) {
  return (
    <Card
      className="gap-0 py-5 transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both hover:-translate-y-0.5 hover:shadow-md motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ animationDelay: `${index * 60}ms` }}
    >
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