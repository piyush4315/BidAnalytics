import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { calculateLotFinancials, DEFAULT_RATES } from "../src/lib/calc";
import { prisma } from "../src/lib/prisma";

type SeedLot = {
  quantity: number;
  lotName: string;
  rate: number;
  auctionNumber: string;
  unit: string;
  lotNumber: string;
  buyerName: string;
  materialValue: number;
  gstTdsRate: number;
  sdReceived: number | null;
  sdDate: string | null;
  fpReceived: number | null;
  fpDate: string | null;
  invoiceNumber: string | null;
  sapDocument: string | null;
  docDate: string | null;
  remark: string | null;
  status: string;
};

async function main() {
  const file = path.join(process.cwd(), "data", "seed-lots.json");
  const lots: SeedLot[] = JSON.parse(fs.readFileSync(file, "utf8"));

  const existing = await prisma.user.count();
  if (existing && process.env.FORCE_SEED !== "1") {
    console.log("Database already has data — skip seed (set FORCE_SEED=1 to reset).");
    return;
  }

  await prisma.payment.deleteMany();
  await prisma.sapDocument.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.taxConfig.deleteMany();
  await prisma.user.deleteMany();

  const password = {
    admin: await bcrypt.hash("Admin@123", 10),
    manager: await bcrypt.hash("Manager@123", 10),
    entry: await bcrypt.hash("Entry@123", 10),
    viewer: await bcrypt.hash("Viewer@123", 10),
  };

  const admin = await prisma.user.create({
    data: { name: "Ananya Rao", email: "admin@bidledger.local", passwordHash: password.admin, role: "ADMIN" },
  });
  await prisma.user.create({
    data: { name: "Vikram Shah", email: "manager@bidledger.local", passwordHash: password.manager, role: "MANAGER" },
  });
  await prisma.user.create({
    data: { name: "Priya Nair", email: "entry@bidledger.local", passwordHash: password.entry, role: "DATA_ENTRY" },
  });
  await prisma.user.create({
    data: { name: "Rahul Mehta", email: "viewer@bidledger.local", passwordHash: password.viewer, role: "VIEWER" },
  });

  await prisma.taxConfig.create({
    data: {
      ...DEFAULT_RATES,
      defaultGstTdsRate: 0,
      notes:
        "Rates taken from Combined Bid Sheet dated 23.08.2026. Cash receivable factor 117.65% is the Working-sheet base; GST TDS is subtracted separately when the lot GST TDS rate is non-zero. Service charge 2.25% is grossed up by 118%.",
      updatedById: admin.id,
    },
  });

  const auctionMeta: Record<string, { title: string }> = {
    "21977": { title: "MSTC e-auction 21977" },
    "21978": { title: "MSTC e-auction 21978" },
    "21979": { title: "MSTC e-auction 21979" },
    "21980": { title: "MSTC e-auction 21980" },
  };

  const auctionIds: Record<string, string> = {};
  for (const number of Object.keys(auctionMeta)) {
    const a = await prisma.auction.create({
      data: {
        number,
        title: auctionMeta[number].title,
        description: "Imported from Combined Bid Sheet (Auctions 21977–21980), 23.08.2026.",
        status: "OPEN",
        auctionDate: new Date("2026-08-01"),
      },
    });
    auctionIds[number] = a.id;
  }

  const buyerIds: Record<string, string> = {};
  const names = Array.from(new Set(lots.map((l) => l.buyerName)));
  for (const name of names) {
    const b = await prisma.buyer.create({
      data: { name, isActive: true },
    });
    buyerIds[name] = b.id;
  }

  for (const row of lots) {
    const calc = calculateLotFinancials(row.materialValue, row.gstTdsRate, DEFAULT_RATES);
    const lot = await prisma.lot.create({
      data: {
        lotNumber: row.lotNumber,
        auctionId: auctionIds[row.auctionNumber],
        buyerId: buyerIds[row.buyerName],
        name: row.lotName,
        quantity: row.quantity,
        unit: row.unit,
        status: (row.status || "Sold").toUpperCase(),
        rate: row.rate,
        materialValue: row.materialValue,
        gstTdsRate: row.gstTdsRate,
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
        notes: row.remark,
      },
    });

    if (row.sdReceived && row.sdReceived > 0) {
      await prisma.payment.create({
        data: {
          lotId: lot.id,
          type: "SECURITY_DEPOSIT",
          amount: row.sdReceived,
          receivedOn: row.sdDate ? new Date(row.sdDate) : null,
          remarks: "Imported from Combined Bid Sheet",
          createdById: admin.id,
        },
      });
    }

    if (row.fpReceived && row.fpReceived > 0) {
      await prisma.payment.create({
        data: {
          lotId: lot.id,
          type: "FINAL_PAYMENT",
          amount: row.fpReceived,
          receivedOn: row.fpDate ? new Date(row.fpDate) : null,
          remarks: row.remark || "Imported from Combined Bid Sheet",
          createdById: admin.id,
        },
      });
    }

    let invoiceId: string | undefined;
    if (row.invoiceNumber) {
      const inv = await prisma.invoice.create({
        data: {
          lotId: lot.id,
          invoiceNumber: row.invoiceNumber,
          invoiceDate: row.docDate ? new Date(row.docDate) : null,
          amount: calc.totalReceivable,
          status: "GENERATED",
        },
      });
      invoiceId = inv.id;
    }

    if (row.sapDocument) {
      await prisma.sapDocument.create({
        data: {
          lotId: lot.id,
          invoiceId: invoiceId || null,
          documentNumber: row.sapDocument,
          documentType: "DR",
          documentDate: row.docDate ? new Date(row.docDate) : null,
          amount: calc.totalReceivable,
          postingStatus: "POSTED",
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        entityType: "Lot",
        entityId: lot.id,
        action: "IMPORT",
        meta: JSON.stringify({ source: "Combined_Bid_Sheet 23.08.2026.xlsx", lotNumber: row.lotNumber }),
      },
    });
  }

  await prisma.importJob.create({
    data: {
      filename: "Combined_Bid_Sheet 23.08.2026.xlsx",
      sheetName: "Final Calculation Sheet",
      status: "COMPLETED",
      result: JSON.stringify({ lots: lots.length, auctions: 4, buyers: names.length }),
      createdById: admin.id,
    },
  });

  console.log(`Seeded ${lots.length} lots, ${names.length} buyers, 4 auctions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
