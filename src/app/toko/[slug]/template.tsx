import type { ReactNode } from "react";

export default function TenantTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none">
      {children}
    </div>
  );
}