import { prisma } from "./prisma";
import { rollupLot } from "./lot-finance";

export type Alert = {
  id: string;
  type: string;
  severity: "warning" | "danger" | "info";
  title: string;
  message: string;
  href: string;
};

export async function getAlerts(): Promise<Alert[]> {
  const lots = await prisma.lot.findMany({
    where: { deletedAt: null },
    include: {
      payments: { where: { deletedAt: null } },
      invoices: { where: { deletedAt: null } },
      sapDocuments: { where: { deletedAt: null } },
      buyer: true,
      auction: true,
    },
  });

  const alerts: Alert[] = [];
  for (const lot of lots) {
    const r = rollupLot(lot);
    const buyer = lot.buyer?.name ?? "Unassigned buyer";
    if (r.sdStatus === "PENDING") {
      alerts.push({
        id: `sd-pending-${lot.id}`,
        type: "SD_PENDING",
        severity: "danger",
        title: `Security deposit pending — lot ${lot.lotNumber}`,
        message: `${buyer} · expected ${lot.securityDepositExpected.toLocaleString("en-IN")}`,
        href: `/lots/${lot.id}`,
      });
    } else if (r.sdStatus === "PARTIAL") {
      alerts.push({
        id: `sd-partial-${lot.id}`,
        type: "SD_PARTIAL",
        severity: "warning",
        title: `Security deposit short — lot ${lot.lotNumber}`,
        message: `${buyer} · ${r.sdDiff.toLocaleString("en-IN")} remaining`,
        href: `/lots/${lot.id}`,
      });
    }
    if (r.fpStatus === "PENDING") {
      alerts.push({
        id: `fp-pending-${lot.id}`,
        type: "FP_PENDING",
        severity: "danger",
        title: `Final payment pending — lot ${lot.lotNumber}`,
        message: `${buyer} · expected ${lot.finalPaymentExpected.toLocaleString("en-IN")}`,
        href: `/lots/${lot.id}`,
      });
    } else if (r.fpStatus === "PARTIAL" || r.settleStatus === "SHORT") {
      if (r.fpDiff > 1) {
        alerts.push({
          id: `fp-short-${lot.id}`,
          type: "FP_SHORT",
          severity: "warning",
          title: `Short payment — lot ${lot.lotNumber}`,
          message: `${buyer} · short ${r.fpDiff.toLocaleString("en-IN")}`,
          href: `/lots/${lot.id}`,
        });
      }
    } else if (r.settleStatus === "EXCESS" && r.outstanding < -1) {
      alerts.push({
        id: `excess-${lot.id}`,
        type: "EXCESS",
        severity: "info",
        title: `Excess payment — lot ${lot.lotNumber}`,
        message: `${buyer} · excess ${Math.abs(r.outstanding).toLocaleString("en-IN")}`,
        href: `/lots/${lot.id}`,
      });
    }
    if (!r.hasInvoice) {
      alerts.push({
        id: `inv-${lot.id}`,
        type: "INVOICE_MISSING",
        severity: "info",
        title: `Invoice missing — lot ${lot.lotNumber}`,
        message: buyer,
        href: `/lots/${lot.id}`,
      });
    }
    if (!r.hasSap) {
      alerts.push({
        id: `sap-${lot.id}`,
        type: "SAP_MISSING",
        severity: "info",
        title: `SAP document missing — lot ${lot.lotNumber}`,
        message: buyer,
        href: `/lots/${lot.id}`,
      });
    }
  }

  const rank = { danger: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return alerts;
}
