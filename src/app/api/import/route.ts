import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { suggestMapping, parseNumber, parseDate, type ImportField } from "@/lib/import-map";
import { prisma } from "@/lib/prisma";
import { calculateLotFinancials } from "@/lib/calc";
import { getTaxRates } from "@/lib/queries";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

function cellVal(cell: ExcelJS.Cell): unknown {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && v && "result" in v) return (v as { result: unknown }).result ?? null;
  if (typeof v === "object" && v && "text" in v) return (v as { text: string }).text;
  if (typeof v === "object" && v && "formula" in v) {
    const f = String((v as { formula: string }).formula);
    if (f.includes("T") && !f.includes("H")) return "__SD_EXPECTED__";
    if (f.includes("W")) return "__FP_EXPECTED__";
    return null;
  }
  return v;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canWrite(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const intent = String(form.get("intent") || "preview");
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Upload an Excel file." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const sheetNames = wb.worksheets.map((s) => s.name);
  const preferred =
    sheetNames.find((n) => /final/i.test(n)) ||
    sheetNames.find((n) => /working/i.test(n)) ||
    sheetNames[0] ||
    "";
  const sheetName = String(form.get("sheet") || preferred);
  const ws = wb.getWorksheet(sheetName);
  if (!ws) return NextResponse.json({ error: "Sheet not found." }, { status: 400 });

  let headerRow = 1;
  for (let r = 1; r <= Math.min(8, ws.rowCount); r++) {
    const vals = (ws.getRow(r).values as unknown[]).filter(Boolean);
    if (vals.length >= 4) {
      headerRow = r;
      break;
    }
  }
  const headerCells = ws.getRow(headerRow).values as unknown[];
  const headers: string[] = [];
  const colIndex: number[] = [];
  const seenHeaders = new Map<string, number>();
  for (let i = 1; i < headerCells.length; i++) {
    const h = headerCells[i];
    if (h === null || h === undefined || h === "") continue;
    let name = String(h).replace(/\n/g, " ").trim();
    const n = (seenHeaders.get(name) || 0) + 1;
    seenHeaders.set(name, n);
    if (n > 1) name = `${name} (${n})`;
    headers.push(name);
    colIndex.push(i);
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const rec: Record<string, unknown> = {};
    let empty = true;
    colIndex.forEach((ci, idx) => {
      const v = cellVal(row.getCell(ci));
      rec[headers[idx]] = v;
      if (v !== null && v !== undefined && v !== "") empty = false;
    });
    if (!empty) rows.push(rec);
  }

  if (intent === "preview") {
    return NextResponse.json({
      filename: file.name,
      sheets: sheetNames,
      sheet: sheetName,
      headers,
      mapping: suggestMapping(headers),
      preview: rows.slice(0, 25),
      rowCount: rows.length,
    });
  }

  const mapping = JSON.parse(String(form.get("mapping") || "{}")) as Record<string, ImportField | "">;
  const rates = await getTaxRates();
  const errors: { row: number; message: string }[] = [];
  const created: string[] = [];
  const seenLots = new Set<string>();

  await prisma.importJob.create({
    data: { filename: file.name, sheetName, status: "RUNNING", mapping: JSON.stringify(mapping), createdById: user.id },
  });

  for (let i = 0; i < rows.length; i++) {
    const rec = rows[i];
    const get = (field: ImportField) => {
      const header = Object.keys(mapping).find((h) => mapping[h] === field);
      return header ? rec[header] : undefined;
    };
    const lotNumber = String(get("lotNumber") ?? "").trim();
    const auctionNumber = String(get("auctionNumber") ?? "").trim();
    const buyerName = String(get("buyerName") ?? "").trim();
    const name = String(get("name") ?? "").trim();
    if (!lotNumber) {
      errors.push({ row: i + 2, message: "Missing lot number" });
      continue;
    }
    if (seenLots.has(lotNumber)) {
      errors.push({ row: i + 2, message: `Duplicate lot number ${lotNumber} in file` });
      continue;
    }
    seenLots.add(lotNumber);
    const existing = await prisma.lot.findFirst({ where: { lotNumber, deletedAt: null } });
    if (existing) {
      errors.push({ row: i + 2, message: `Lot ${lotNumber} already exists` });
      continue;
    }
    if (!auctionNumber) {
      errors.push({ row: i + 2, message: "Missing auction / bid sheet number" });
      continue;
    }
    const quantity = parseNumber(get("quantity")) ?? 0;
    const rate = parseNumber(get("rate")) ?? 0;
    const materialValue = parseNumber(get("materialValue")) ?? quantity * rate;
    if (!(materialValue > 0)) {
      errors.push({ row: i + 2, message: "Invalid material value" });
      continue;
    }
    let gstTdsRate = parseNumber(get("gstTdsRate")) ?? rates.defaultGstTdsRate;
    if (gstTdsRate > 1) gstTdsRate = gstTdsRate / 100;

    let auction = await prisma.auction.findFirst({ where: { number: auctionNumber, deletedAt: null } });
    if (!auction) {
      auction = await prisma.auction.create({
        data: { number: auctionNumber, title: `Imported auction ${auctionNumber}`, status: "OPEN" },
      });
    }
    let buyerId: string | null = null;
    if (buyerName) {
      let buyer = await prisma.buyer.findFirst({ where: { name: buyerName, deletedAt: null } });
      if (!buyer) buyer = await prisma.buyer.create({ data: { name: buyerName } });
      buyerId = buyer.id;
    }

    const calc = calculateLotFinancials(materialValue, gstTdsRate, rates);
    const lot = await prisma.lot.create({
      data: {
        lotNumber,
        auctionId: auction.id,
        buyerId,
        name: name || `Lot ${lotNumber}`,
        quantity,
        unit: String(get("unit") || "NO"),
        status: String(get("status") || "SOLD").toUpperCase(),
        rate,
        materialValue,
        gstTdsRate,
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
      },
    });
    created.push(lot.lotNumber);

    let sdRec = get("securityDepositReceived");
    let sdAmt = sdRec === "__SD_EXPECTED__" ? calc.securityDepositExpected : parseNumber(sdRec);
    if (sdAmt && sdAmt > 0) {
      await prisma.payment.create({
        data: {
          lotId: lot.id,
          type: "SECURITY_DEPOSIT",
          amount: sdAmt,
          receivedOn: parseDate(get("sdDate")),
          createdById: user.id,
          remarks: "Imported",
        },
      });
    }
    let fpRec = get("finalPaymentReceived");
    let fpAmt = fpRec === "__FP_EXPECTED__" ? calc.finalPaymentExpected : parseNumber(fpRec);
    if (fpAmt && fpAmt > 0) {
      await prisma.payment.create({
        data: {
          lotId: lot.id,
          type: "FINAL_PAYMENT",
          amount: fpAmt,
          receivedOn: parseDate(get("fpDate")),
          createdById: user.id,
          remarks: "Imported",
        },
      });
    }
    const inv = String(get("invoiceNumber") || "").trim();
    const sap = String(get("sapDocument") || "").trim();
    const docDate = parseDate(get("docDate"));
    let invoiceId: string | undefined;
    if (inv) {
      const invoice = await prisma.invoice.create({
        data: { lotId: lot.id, invoiceNumber: inv, invoiceDate: docDate, amount: calc.totalReceivable, status: "GENERATED" },
      });
      invoiceId = invoice.id;
    }
    if (sap) {
      await prisma.sapDocument.create({
        data: {
          lotId: lot.id,
          invoiceId,
          documentNumber: sap,
          documentDate: docDate,
          amount: calc.totalReceivable,
          postingStatus: "POSTED",
        },
      });
    }
    await writeAudit({
      userId: user.id,
      entityType: "Lot",
      entityId: lot.id,
      action: "IMPORT",
      newValue: lotNumber,
      meta: { file: file.name },
    });
  }

  await prisma.importJob.create({
    data: {
      filename: file.name,
      sheetName,
      status: errors.length && !created.length ? "FAILED" : "COMPLETED",
      mapping: JSON.stringify(mapping),
      result: JSON.stringify({ created: created.length, errors }),
      createdById: user.id,
    },
  });

  return NextResponse.json({ created: created.length, lots: created, errors });
}
