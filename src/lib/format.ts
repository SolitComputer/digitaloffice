const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

export function formatDate(value: Date): string {
  return dateFormatter.format(value);
}