/**
 * Central financial calculation engine.
 *
 * Formulas are taken from Combined Bid Sheet (Final Calculation Sheet + Working).
 * Rates are injected — never hard-coded at the call site.
 *
 * Observed Excel logic (23.08.2026 sheet):
 *   GST                  = ROUND(MV * gstRate, 0)
 *   MV + GST             = MV + GST
 *   TCS                  = ROUND((MV + GST) * tcsRate, 0)
 *   TDS 194(O)           = MV * tds194ORate            (unrounded on the row)
 *   Service charge gross = MV * scRate * scGstFactor   (2.25% × 118%)
 *   TDS 194(H)           = MV * scRate * tds194HRate
 *   Net service charge   = gross − TDS 194(H)
 *   Service charge MSTC  = ROUND(net + TDS 194(O), 0)
 *   GST TDS              = ROUND(MV * gstTdsRate, 0)   (per-lot rate, 0 or 2%)
 *   Total cash recv.     = ROUND(MV * cashFactor − GST TDS, 0)
 *   SD expected          = ROUND(MV * sdRate, 0)
 *   FP expected          = ROUND(MV * (cashFactor − sdRate) − GST TDS, 0)
 *
 * The 117.65% cash factor is stored as configuration. The Working sheet uses it
 * as a base percentage; GST TDS is subtracted separately when the lot rate > 0.
 * We do not invent a statutory derivation for the 0.35% gap vs 118%.
 */

export type TaxRates = {
  gstRate: number;
  tcsRate: number;
  tds194ORate: number;
  serviceChargeRate: number;
  serviceChargeGstFactor: number;
  tds194HRate: number;
  cashReceivableFactor: number;
  securityDepositRate: number;
  defaultGstTdsRate: number;
};

export const DEFAULT_RATES: TaxRates = {
  gstRate: 0.18,
  tcsRate: 0.02,
  tds194ORate: 0.001,
  serviceChargeRate: 0.0225,
  serviceChargeGstFactor: 1.18,
  tds194HRate: 0.02,
  cashReceivableFactor: 1.1765,
  securityDepositRate: 0.25,
  defaultGstTdsRate: 0,
};

/** Excel ROUND — half away from zero. */
export function excelRound(value: number, digits = 0): number {
  if (!Number.isFinite(value)) return 0;
  const p = 10 ** digits;
  const x = value * p;
  const rounded = x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5);
  return rounded / p;
}

export type LotCalculation = {
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
  rates: TaxRates;
};

export function calculateLotFinancials(
  materialValue: number,
  gstTdsRate: number,
  rates: TaxRates = DEFAULT_RATES,
): LotCalculation {
  const mv = Number(materialValue) || 0;
  const gstTds = Number(gstTdsRate) || 0;

  const gstAmount = excelRound(mv * rates.gstRate, 0);
  const materialValueWithGst = mv + gstAmount;
  const tcsAmount = excelRound(materialValueWithGst * rates.tcsRate, 0);
  const tds194O = mv * rates.tds194ORate;
  const serviceChargeGross = mv * rates.serviceChargeRate * rates.serviceChargeGstFactor;
  const tds194H = mv * rates.serviceChargeRate * rates.tds194HRate;
  const netServiceCharge = serviceChargeGross - tds194H;
  const serviceChargeToMstc = excelRound(netServiceCharge + tds194O, 0);
  const gstTdsAmount = excelRound(mv * gstTds, 0);
  const totalReceivable = excelRound(mv * rates.cashReceivableFactor - gstTdsAmount, 0);
  const securityDepositExpected = excelRound(mv * rates.securityDepositRate, 0);
  const finalPaymentFactor = rates.cashReceivableFactor - rates.securityDepositRate;
  const finalPaymentExpected = excelRound(mv * finalPaymentFactor - gstTdsAmount, 0);

  return {
    materialValue: mv,
    gstTdsRate: gstTds,
    gstAmount,
    materialValueWithGst,
    tcsAmount,
    tds194O,
    serviceChargeGross,
    tds194H,
    netServiceCharge,
    serviceChargeToMstc,
    gstTdsAmount,
    totalReceivable,
    securityDepositExpected,
    finalPaymentExpected,
    rates: { ...rates },
  };
}

export function applyCalculation<T extends Record<string, unknown>>(lot: T, calc: LotCalculation): T {
  return {
    ...lot,
    gstAmount: calc.gstAmount,
    materialValueWithGst: calc.materialValueWithGst,
    tcsAmount: calc.tcsAmount,
    tds194O: calc.tds194O,
    serviceChargeGross: calc.serviceChargeGross,
    tds194H: calc.tds194H,
    netServiceCharge: calc.netServiceCharge,
    serviceChargeToMstc: calc.serviceChargeToMstc,
    gstTdsAmount: calc.gstTdsAmount,
    totalReceivable: calc.totalReceivable,
    securityDepositExpected: calc.securityDepositExpected,
    finalPaymentExpected: calc.finalPaymentExpected,
    calcSnapshot: JSON.stringify(calc.rates),
  };
}

export type PaymentStatus =
  | "PENDING"
  | "PARTIAL"
  | "RECEIVED"
  | "SHORT"
  | "EXCESS";

const RUPEE_TOLERANCE = 1;

export function classifyAmount(expected: number, received: number): PaymentStatus {
  const rec = received || 0;
  if (rec <= 0) return "PENDING";
  const diff = expected - rec;
  if (Math.abs(diff) <= RUPEE_TOLERANCE) return "RECEIVED";
  if (rec < expected) return rec > 0 ? "PARTIAL" : "PENDING";
  return "EXCESS";
}

export function classifyLotSettlement(receivable: number, received: number): PaymentStatus {
  const rec = received || 0;
  if (rec <= 0) return "PENDING";
  const diff = receivable - rec;
  if (Math.abs(diff) <= RUPEE_TOLERANCE) return "RECEIVED";
  if (diff > RUPEE_TOLERANCE) return rec > 0 ? "SHORT" : "PENDING";
  return "EXCESS";
}

export function paymentStatusLabel(status: PaymentStatus, kind: "sd" | "fp" | "lot" = "lot"): string {
  if (kind === "sd") {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "PARTIAL":
        return "Partially received";
      case "RECEIVED":
        return "Fully received";
      case "SHORT":
        return "Short received";
      case "EXCESS":
        return "Excess received";
    }
  }
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PARTIAL":
      return "Partially paid";
    case "RECEIVED":
      return "Fully paid";
    case "SHORT":
      return "Short paid";
    case "EXCESS":
      return "Excess paid";
  }
}

export type CalcLine = {
  key: string;
  label: string;
  detail?: string;
  amount: number;
  sign?: "plus" | "minus" | "eq" | "info";
  group: "tax" | "service" | "cash" | "settlement";
};

export function calculationLines(calc: LotCalculation): CalcLine[] {
  const r = calc.rates;
  const pct = (n: number) => `${(n * 100).toFixed(n * 100 < 1 ? 2 : n * 100 % 1 === 0 ? 0 : 2)}%`;
  return [
    {
      key: "mv",
      label: "Material value",
      amount: calc.materialValue,
      sign: "info",
      group: "tax",
    },
    {
      key: "gst",
      label: "GST",
      detail: `ROUND(MV × ${pct(r.gstRate)}, 0)`,
      amount: calc.gstAmount,
      sign: "plus",
      group: "tax",
    },
    {
      key: "mvgst",
      label: "Material value + GST",
      amount: calc.materialValueWithGst,
      sign: "eq",
      group: "tax",
    },
    {
      key: "tcs",
      label: "TCS",
      detail: `ROUND((MV + GST) × ${pct(r.tcsRate)}, 0) — computed, not added to cash receivable`,
      amount: calc.tcsAmount,
      sign: "info",
      group: "tax",
    },
    {
      key: "tds194o",
      label: "TDS u/s 194(O)",
      detail: `MV × ${pct(r.tds194ORate)}`,
      amount: calc.tds194O,
      sign: "info",
      group: "service",
    },
    {
      key: "scg",
      label: "Service charge to MSTC (gross, with GST)",
      detail: `MV × ${pct(r.serviceChargeRate)} × ${pct(r.serviceChargeGstFactor - 1)} GST factor (${r.serviceChargeGstFactor})`,
      amount: calc.serviceChargeGross,
      sign: "info",
      group: "service",
    },
    {
      key: "tds194h",
      label: "TDS u/s 194(H)",
      detail: `MV × ${pct(r.serviceChargeRate)} × ${pct(r.tds194HRate)}`,
      amount: calc.tds194H,
      sign: "minus",
      group: "service",
    },
    {
      key: "netsc",
      label: "Net service charge (post TDS 194H)",
      amount: calc.netServiceCharge,
      sign: "eq",
      group: "service",
    },
    {
      key: "scmstc",
      label: "Service charge to MSTC",
      detail: "ROUND(net service charge + TDS 194(O), 0)",
      amount: calc.serviceChargeToMstc,
      sign: "eq",
      group: "service",
    },
    {
      key: "factor",
      label: "Cash factor on material value",
      detail: `MV × ${(r.cashReceivableFactor * 100).toFixed(2)}%`,
      amount: excelRound(calc.materialValue * r.cashReceivableFactor, 2),
      sign: "info",
      group: "cash",
    },
    {
      key: "gsttds",
      label: "GST TDS",
      detail: `ROUND(MV × ${(gstTdsPct(calc.gstTdsRate))}, 0)`,
      amount: calc.gstTdsAmount,
      sign: "minus",
      group: "cash",
    },
    {
      key: "recv",
      label: "Total receivables in cash",
      detail: `ROUND(MV × ${(r.cashReceivableFactor * 100).toFixed(2)}% − GST TDS, 0)`,
      amount: calc.totalReceivable,
      sign: "eq",
      group: "cash",
    },
    {
      key: "sd",
      label: "Security deposit expected",
      detail: `ROUND(MV × ${pct(r.securityDepositRate)}, 0)`,
      amount: calc.securityDepositExpected,
      sign: "info",
      group: "settlement",
    },
    {
      key: "fp",
      label: "Final payment expected",
      detail: `ROUND(MV × ${((r.cashReceivableFactor - r.securityDepositRate) * 100).toFixed(2)}% − GST TDS, 0)`,
      amount: calc.finalPaymentExpected,
      sign: "eq",
      group: "settlement",
    },
  ];
}

function gstTdsPct(rate: number) {
  return `${(rate * 100).toFixed(rate === 0 ? 0 : 2)}%`;
}

export function ratesFromConfig(cfg: Partial<TaxRates> & Record<string, unknown>): TaxRates {
  return {
    gstRate: Number(cfg.gstRate ?? DEFAULT_RATES.gstRate),
    tcsRate: Number(cfg.tcsRate ?? DEFAULT_RATES.tcsRate),
    tds194ORate: Number(cfg.tds194ORate ?? DEFAULT_RATES.tds194ORate),
    serviceChargeRate: Number(cfg.serviceChargeRate ?? DEFAULT_RATES.serviceChargeRate),
    serviceChargeGstFactor: Number(cfg.serviceChargeGstFactor ?? DEFAULT_RATES.serviceChargeGstFactor),
    tds194HRate: Number(cfg.tds194HRate ?? DEFAULT_RATES.tds194HRate),
    cashReceivableFactor: Number(cfg.cashReceivableFactor ?? DEFAULT_RATES.cashReceivableFactor),
    securityDepositRate: Number(cfg.securityDepositRate ?? DEFAULT_RATES.securityDepositRate),
    defaultGstTdsRate: Number(cfg.defaultGstTdsRate ?? DEFAULT_RATES.defaultGstTdsRate),
  };
}
