import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  subtitle?: string;
  className?: string;
};

export function AuthShell({
  children,
  subtitle = "Kelola toko Anda dalam satu tempat",
  className,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-radial-[at_50%_0%] from-primary/15 to-transparent to-70%"
      />

      <div
        className={cn(
          "relative w-full max-w-sm space-y-6 animate-in fade-in-0 zoom-in-95 duration-300 ease-out motion-reduce:animate-none",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm">
            D
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">DigitalOffice</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}