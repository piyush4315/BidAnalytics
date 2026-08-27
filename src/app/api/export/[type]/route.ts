import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { getLots, getDashboard } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { type: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "BidLedger";
  const lots = await getLots();
  const dash = await getDashboard();

  if (params.type === "lots" || params.type === "bid-sheet") {
    const ws = wb.addWorksheet("Lots");
    ws.addRow([
      "Lot",
      "Auction",
      "Buyer",
      "Material",
      "Qty",
      "Unit",
      "Rate",
      "Material value",
      "GST",
      "TCS",
      "GST TDS",
      "Receivable",
      "SD expected",
      "SD received",
      "FP expected",
      "FP received",
      "Outstanding",
      "Invoice",
      "SAP",
    ]);
    for (const l of lots) {
      ws.addRow([
        l.lotNumber,
        l.auction.number,
        l.buyer?.name,
        l.name,
        l.quantity,
        l.unit,
        l.rate,
        l.materialValue,
        l.gstAmount,
        l.tcsAmount,
        l.gstTdsAmount,
        l.totalReceivable,
        l.securityDepositExpected,
        l.rollup.sdReceived,
        l.finalPaymentExpected,
        l.rollup.fpReceived,
        l.rollup.outstanding,
        l.rollup.invoiceNumber,
        l.rollup.sapNumber,
      ]);
    }
  } else if (params.type === "auction-summary") {
    const ws = wb.addWorksheet("Auction summary");
    ws.addRow(["Auction", "Lots", "Material value", "Receivable", "Received", "Outstanding"]);
    for (const a of dash.byAuction) {
      ws.addRow([a.number, a.lots, a.materialValue, a.receivable, a.received, a.outstanding]);
    }
  } else if (params.type === "buyer-summary") {
    const ws = wb.addWorksheet("Buyer summary");
    ws.addRow(["Buyer", "Lots", "Receivable", "Paid", "Outstanding"]);
    for (const b of dash.byBuyer) {
      ws.addRow([b.name, b.lots, b.receivable, b.received, b.outstanding]);
    }
  } else if (params.type === "outstanding") {
    const ws = wb.addWorksheet("Outstanding");
    ws.addRow(["Lot", "Auction", "Buyer", "Expected", "Received", "Difference", "Status"]);
    for (const l of lots.filter((x) => Math.abs(x.rollup.outstanding) > 1)) {
      ws.addRow([
        l.lotNumber,
        l.auction.number,
        l.buyer?.name,
        l.totalReceivable,
        l.rollup.totalReceived,
        l.rollup.outstanding,
        l.rollup.settleStatus,
      ]);
    }
  } else {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bidledger-${params.type}.xlsx"`,
    },
  });
}
