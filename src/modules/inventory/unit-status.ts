import type { UnitStatus } from "@/db/schema";

export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  SIAP_JUAL: "Siap Jual",
  BELUM_SIAP: "Belum Siap",
  SERVICE: "Service",
  MATOT: "Matot",
};

export const UNIT_STATUS_VARIANTS: Record<UnitStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SIAP_JUAL: "default",
  BELUM_SIAP: "outline",
  SERVICE: "secondary",
  MATOT: "destructive",
};