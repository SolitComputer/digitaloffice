"use client";

import { RouteError, type RouteErrorProps } from "@/components/route-error";

export default function AdminError(props: RouteErrorProps) {
  return <RouteError {...props} />;
}
