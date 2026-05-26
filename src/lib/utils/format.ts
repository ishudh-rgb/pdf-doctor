import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(
  dateStr: string | Date,
  pattern: string = "dd MMM yyyy"
): string {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return format(date, pattern);
}

export function formatRelativeDate(dateStr: string | Date): string {
  const date = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(
  amount: number,
  currency: string = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
