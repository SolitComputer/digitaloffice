import { Badge } from "@/components/ui/badge";
import type { tenants } from "@/db/schema";

type TenantStatusBadgeProps = {
  status: (typeof tenants.$inferSelect)["status"];
};

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  return status === "ACTIVE" ? (
    <Badge variant="secondary">Aktif</Badge>
  ) : (
    <Badge variant="destructive">Di-suspend</Badge>
  );
}