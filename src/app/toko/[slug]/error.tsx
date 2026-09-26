"use client";

import { RouteError, type RouteErrorProps } from "@/components/route-error";

export default function TenantError(props: RouteErrorProps) {
  return <RouteError {...props} />;
}
