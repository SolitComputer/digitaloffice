import { Button } from "@/components/ui/button";
import { signOutAction } from "@/modules/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Keluar
      </Button>
    </form>
  );
}