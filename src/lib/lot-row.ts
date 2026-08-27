import type { PaymentStatus } from "./calc";

export type LotRow = {
  id: string;
  lotNumber: string;
  name: string;
  auctionNumber: string;
  buyerName: string;
  quantity: number;
  unit: string;
  status: string;
  rate: number;
  materialValue: number;
  gstAmount: number;
  tcsAmount: number;
  gstTdsAmount: number;
  serviceChargeToMstc: number;
  totalReceivable: number;
  sdExpected: number;
  sdReceived: number;
  fpExpected: number;
  fpReceived: number;
  received: number;
  outstanding: number;
  sdStatus: PaymentStatus;
  fpStatus: PaymentStatus;
  settleStatus: PaymentStatus;
  invoiceNumber: string | null;
  sapNumber: string | null;
  lastSdDate: string | null;
  lastFpDate: string | null;
};

export function toLotRow(lot: {
  id: string;
  lotNumber: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  rate: number;
  materialValue: number;
  gstAmount: number;
  tcsAmount: number;
  gstTdsAmount: number;
  serviceChargeToMstc: number;
  totalReceivable: number;
  securityDepositExpected: number;
  finalPaymentExpected: number;
  auction: { number: string };
  buyer: { name: string } | null;
  rollup: {
    sdReceived: number;
    fpReceived: number;
    totalReceived: number;
    outstanding: number;
    sdStatus: PaymentStatus;
    fpStatus: PaymentStatus;
    settleStatus: PaymentStatus;
    invoiceNumber: string | null;
    sapNumber: string | null;
    lastSdDate: Date | string | null;
    lastFpDate: Date | string | null;
  };
}): LotRow {
  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    name: lot.name,
    auctionNumber: lot.auction.number,
    buyerName: lot.buyer?.name || "Unassigned",
    quantity: lot.quantity,
    unit: lot.unit,
    status: lot.status,
    rate: lot.rate,
    materialValue: lot.materialValue,
    gstAmount: lot.gstAmount,
    tcsAmount: lot.tcsAmount,
    gstTdsAmount: lot.gstTdsAmount,
    serviceChargeToMstc: lot.serviceChargeToMstc,
    totalReceivable: lot.totalReceivable,
    sdExpected: lot.securityDepositExpected,
    sdReceived: lot.rollup.sdReceived,
    fpExpected: lot.finalPaymentExpected,
    fpReceived: lot.rollup.fpReceived,
    received: lot.rollup.totalReceived,
    outstanding: lot.rollup.outstanding,
    sdStatus: lot.rollup.sdStatus,
    fpStatus: lot.rollup.fpStatus,
    settleStatus: lot.rollup.settleStatus,
    invoiceNumber: lot.rollup.invoiceNumber,
    sapNumber: lot.rollup.sapNumber,
    lastSdDate: lot.rollup.lastSdDate ? new Date(lot.rollup.lastSdDate).toISOString() : null,
    lastFpDate: lot.rollup.lastFpDate ? new Date(lot.rollup.lastFpDate).toISOString() : null,
  };
}
