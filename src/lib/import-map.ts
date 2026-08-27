import { FIELD_LABELS } from "./constants";

export const IMPORT_FIELDS = [
  "lotNumber",
  "auctionNumber",
  "buyerName",
  "name",
  "quantity",
  "unit",
  "status",
  "rate",
  "materialValue",
  "gstTdsRate",
  "securityDepositReceived",
  "sdDate",
  "finalPaymentReceived",
  "fpDate",
  "invoiceNumber",
  "sapDocument",
  "docDate",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

const ALIASES: Record<string, ImportField> = {
  "lot no": "lotNumber",
  "lot no.": "lotNumber",
  "lot number": "lotNumber",
  lot: "lotNumber",
  "bid sheet": "auctionNumber",
  auction: "auctionNumber",
  "auction number": "auctionNumber",
  buyer: "buyerName",
  "lot name": "name",
  material: "name",
  quantity: "quantity",
  qty: "quantity",
  unit: "unit",
  status: "status",
  rate: "rate",
  "mat. value": "materialValue",
  "mat value": "materialValue",
  "material value": "materialValue",
  "gst tds rate": "gstTdsRate",
  "gst tds": "gstTdsRate",
  "security deposit (received)": "securityDepositReceived",
  "security deposit received": "securityDepositReceived",
  "date of receipt": "sdDate",
  "date of receipt (2)": "fpDate",
  "final payment (received)": "finalPaymentReceived",
  "final payment received": "finalPaymentReceived",
  "invoice no": "invoiceNumber",
  "invoice no.": "invoiceNumber",
  "invoice number": "invoiceNumber",
  "sap document": "sapDocument",
  "doc./invoice date": "docDate",
  "doc/invoice date": "docDate",
};

export function suggestMapping(headers: string[]): Record<string, ImportField | ""> {
  const map: Record<string, ImportField | ""> = {};
  const used = new Set<string>();
  for (const h of headers) {
    const key = h.toLowerCase().replace(/\s+/g, " ").trim();
    const field = ALIASES[key];
    if (field && !used.has(field)) {
      map[h] = field;
      used.add(field);
    } else {
      map[h] = "";
    }
  }
  return map;
}

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] || field;
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value).replace(/[, ]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
