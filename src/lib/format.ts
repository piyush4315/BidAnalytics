import { format, parseISO, isValid } from "date-fns";

export function formatINR(value: number | null | undefined, opts?: { paise?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const hasPaise = opts?.paise || Math.abs(value % 1) >= 0.005;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(value);
}

export function formatINRCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (abs >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`;
  }
  return formatINR(value);
}

export function formatQty(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined) return "—";
  const hasFrac = Math.abs(value % 1) >= 0.0001;
  const n = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasFrac ? 1 : 0,
    maximumFractionDigits: hasFrac ? 3 : 0,
  }).format(value);
  return unit ? `${n} ${unit}` : n;
}

export function formatPct(rate: number, digits = 2): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy, HH:mm");
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function signedINR(value: number): { text: string; tone: "short" | "excess" | "settled" } {
  if (Math.abs(value) <= 1) return { text: formatINR(0), tone: "settled" };
  if (value > 0) return { text: formatINR(value), tone: "short" };
  return { text: formatINR(Math.abs(value)), tone: "excess" };
}
