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

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDateTime(value: Date): string {
  return dateTimeFormatter.format(value);
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number): string {
  return rupiahFormatter.format(value);
}