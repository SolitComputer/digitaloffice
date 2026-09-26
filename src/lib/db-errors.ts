export function isDuplicateEntryError(error: unknown): boolean {
  let current: unknown = error;

  while (current instanceof Error) {
    if ("code" in current && current.code === "ER_DUP_ENTRY") return true;
    current = current.cause;
  }

  return false;
}