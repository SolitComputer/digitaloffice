import type { z } from "zod";

export function readField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
