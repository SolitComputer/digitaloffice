export function parseWholeNumber(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return null;

  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}