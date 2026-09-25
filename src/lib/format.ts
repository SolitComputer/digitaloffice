const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}