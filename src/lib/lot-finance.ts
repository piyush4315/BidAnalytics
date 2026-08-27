import {
  classifyAmount,
  classifyLotSettlement,
  type PaymentStatus,
} from "./calc";

export type LotWithPayments = {
  id: string;
  lotNumber: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  rate: number;
  materialValue: number;
  gstTdsRate: number;
  gstAmount: number;
  materialValueWithGst: number;
  tcsAmount: number;
  tds194O: number;
  serviceChargeGross: number;
  tds194H: number;
  netServiceCharge: number;
  serviceChargeToMstc: number;
  gstTdsAmount: number;
  totalReceivable: number;
  securityDepositExpected: number;
  finalPaymentExpected: number;
  notes: string | null;
  auction: { id: string; number: string; title: string | null; status: string };
  buyer: { id: string; name: string } | null;
  payments: { type: string; amount: number; receivedOn: Date | null; deletedAt: Date | null }[];
  invoices: { id: string; invoiceNumber: string; invoiceDate: Date | null; status: string }[];
  sapDocuments: { id: string; documentNumber: string; documentDate: Date | null; postingStatus: string }[];
};

export type LotRollup = {
  sdReceived: number;
  fpReceived: number;
  totalReceived: number;
  outstanding: number;
  shortExcess: number;
  sdDiff: number;
  fpDiff: number;
  sdStatus: PaymentStatus;
  fpStatus: PaymentStatus;
  settleStatus: PaymentStatus;
  lastSdDate: Date | null;
  lastFpDate: Date | null;
  invoiceNumber: string | null;
  sapNumber: string | null;
  hasInvoice: boolean;
  hasSap: boolean;
};

export function rollupLot(lot: {
  totalReceivable: number;
  securityDepositExpected: number;
  finalPaymentExpected: number;
  payments: { type: string; amount: number; receivedOn: Date | null; deletedAt?: Date | null }[];
  invoices?: { invoiceNumber: string }[];
  sapDocuments?: { documentNumber: string }[];
}): LotRollup {
  const live = lot.payments.filter((p) => !p.deletedAt);
  const sdPayments = live.filter((p) => p.type === "SECURITY_DEPOSIT");
  const fpPayments = live.filter((p) => p.type === "FINAL_PAYMENT");
  const sdReceived = sdPayments.reduce((s, p) => s + p.amount, 0);
  const fpReceived = fpPayments.reduce((s, p) => s + p.amount, 0);
  const adjustments = live.filter((p) => p.type === "ADJUSTMENT").reduce((s, p) => s + p.amount, 0);
  const totalReceived = sdReceived + fpReceived + adjustments;
  const outstanding = lot.totalReceivable - totalReceived;
  const lastSdDate = sdPayments.reduce<Date | null>((acc, p) => {
    if (!p.receivedOn) return acc;
    if (!acc || p.receivedOn > acc) return p.receivedOn;
    return acc;
  }, null);
  const lastFpDate = fpPayments.reduce<Date | null>((acc, p) => {
    if (!p.receivedOn) return acc;
    if (!acc || p.receivedOn > acc) return p.receivedOn;
    return acc;
  }, null);

  return {
    sdReceived,
    fpReceived,
    totalReceived,
    outstanding,
    shortExcess: outstanding,
    sdDiff: lot.securityDepositExpected - sdReceived,
    fpDiff: lot.finalPaymentExpected - fpReceived,
    sdStatus: classifyAmount(lot.securityDepositExpected, sdReceived),
    fpStatus: classifyAmount(lot.finalPaymentExpected, fpReceived),
    settleStatus: classifyLotSettlement(lot.totalReceivable, totalReceived),
    lastSdDate,
    lastFpDate,
    invoiceNumber: lot.invoices?.[0]?.invoiceNumber ?? null,
    sapNumber: lot.sapDocuments?.[0]?.documentNumber ?? null,
    hasInvoice: (lot.invoices?.length || 0) > 0,
    hasSap: (lot.sapDocuments?.length || 0) > 0,
  };
}

export function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}
