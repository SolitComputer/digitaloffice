import { Badge } from "@/components/ui/badge";
import type { FormType } from "@/db/schema";
import { FORM_TYPE_LABELS } from "@/modules/inventory/form-config";

export function FormTypeBadge({ formType }: { formType: FormType }) {
  return (
    <Badge variant={formType === "laptop" ? "default" : "secondary"}>{FORM_TYPE_LABELS[formType]}</Badge>
  );
}