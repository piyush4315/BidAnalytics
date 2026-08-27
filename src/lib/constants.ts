export const APP_NAME = "BidLedger";
export const APP_TAGLINE = "Scrap auction operations";

export const NAV = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/auctions", label: "Auctions", icon: "Gavel" },
  { href: "/lots", label: "Lots", icon: "Boxes" },
  { href: "/buyers", label: "Buyers", icon: "Users" },
  { href: "/receivables", label: "Receivables", icon: "Wallet" },
  { href: "/deposits", label: "Security deposits", icon: "Shield" },
  { href: "/payments", label: "Final payments", icon: "Banknote" },
  { href: "/invoices", label: "Invoices", icon: "FileText" },
  { href: "/sap", label: "SAP documents", icon: "Database" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/import", label: "Import data", icon: "Upload" },
] as const;

export const NAV_FOOTER = [
  { href: "/activity", label: "Audit trail", icon: "ScrollText" },
  { href: "/settings", label: "Settings", icon: "Settings" },
  { href: "/admin", label: "Administration", icon: "LockKeyhole", admin: true },
] as const;

export const UNITS = ["NO", "KG", "MT", "LOT"] as const;

export const LOT_STATUSES = ["SOLD", "PENDING", "CANCELLED", "CLOSED"] as const;
export const AUCTION_STATUSES = ["DRAFT", "OPEN", "CLOSED", "CANCELLED"] as const;
export const INVOICE_STATUSES = ["NOT_GENERATED", "GENERATED", "POSTED", "CANCELLED"] as const;
export const SAP_STATUSES = ["PENDING", "POSTED", "CANCELLED"] as const;

export const FIELD_LABELS: Record<string, string> = {
  lotNumber: "Lot number",
  auctionNumber: "Auction / bid sheet",
  buyerName: "Buyer",
  name: "Lot name / material",
  quantity: "Quantity",
  unit: "Unit",
  status: "Status",
  rate: "Rate",
  materialValue: "Material value",
  gstTdsRate: "GST TDS rate",
  gstAmount: "GST",
  materialValueWithGst: "Material value + GST",
  tcsAmount: "TCS",
  tds194O: "TDS u/s 194(O)",
  serviceChargeGross: "Service charge (gross)",
  tds194H: "TDS u/s 194(H)",
  netServiceCharge: "Net service charge",
  serviceChargeToMstc: "Service charge to MSTC",
  gstTdsAmount: "GST TDS",
  totalReceivable: "Total receivables in cash",
  securityDepositExpected: "Security deposit expected",
  securityDepositReceived: "Security deposit received",
  sdDate: "SD receipt date",
  finalPaymentExpected: "Final payment expected",
  finalPaymentReceived: "Final payment received",
  fpDate: "Final payment date",
  invoiceNumber: "Invoice number",
  sapDocument: "SAP document",
  docDate: "Document / invoice date",
};
