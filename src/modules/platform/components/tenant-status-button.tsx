import { Button } from "@/components/ui/button";
import { setTenantStatusAction } from "@/modules/platform/actions";

type TenantStatusButtonProps = {
  tenantId: string;
  status: "ACTIVE" | "SUSPENDED";
};

export function TenantStatusButton({ tenantId, status }: TenantStatusButtonProps) {
  const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  return (
    <form action={setTenantStatusAction}>
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button type="submit" size="sm" variant={nextStatus === "SUSPENDED" ? "outline" : "default"}>
        {nextStatus === "SUSPENDED" ? "Suspend" : "Aktifkan"}
      </Button>
    </form>
  );
}