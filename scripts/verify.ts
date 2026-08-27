import { calculateLotFinancials, DEFAULT_RATES, excelRound } from "../src/lib/calc";
import { rollupLot } from "../src/lib/lot-finance";
import { prisma } from "../src/lib/prisma";

async function main() {
  const failures: string[] = [];
  const lots = await prisma.lot.findMany({
    include: { payments: true, invoices: true, sapDocuments: true, auction: true, buyer: true },
  });
  if (lots.length < 37) failures.push(`Expected at least 37 lots, found ${lots.length}`);

  for (const lot of lots) {
    const calc = calculateLotFinancials(lot.materialValue, lot.gstTdsRate, DEFAULT_RATES);
    const fields: (keyof typeof calc)[] = [
      "gstAmount",
      "totalReceivable",
      "securityDepositExpected",
      "finalPaymentExpected",
      "gstTdsAmount",
    ];
    for (const f of fields) {
      const a = Number(lot[f as keyof typeof lot]);
      const b = Number(calc[f]);
      if (Math.abs(a - b) > 1) failures.push(`Lot ${lot.lotNumber} ${f}: stored ${a} calc ${b}`);
    }
    if (!lot.auctionId) failures.push(`Lot ${lot.lotNumber} missing auction`);
    const r = rollupLot(lot);
    const recon = excelRound(r.totalReceived + r.outstanding - lot.totalReceivable, 2);
    if (Math.abs(recon) > 0.05) failures.push(`Lot ${lot.lotNumber} rollup does not recon`);
  }

  const sample = calculateLotFinancials(790089, 0.02, DEFAULT_RATES);
  if (sample.gstAmount !== 142216) failures.push(`GST sample ${sample.gstAmount}`);
  if (sample.gstTdsAmount !== 15802) failures.push(`GST TDS sample ${sample.gstTdsAmount}`);
  if (sample.totalReceivable !== 913738) failures.push(`Recv sample ${sample.totalReceivable}`);
  if (sample.securityDepositExpected !== 197522) failures.push(`SD sample ${sample.securityDepositExpected}`);
  if (sample.finalPaymentExpected !== 716215) failures.push(`FP sample ${sample.finalPaymentExpected}`);

  const users = await prisma.user.count();
  if (users < 4) failures.push("Missing demo users");

  if (failures.length) {
    console.error("VERIFY FAILED");
    failures.forEach((f) => console.error(" -", f));
    process.exit(1);
  }
  console.log(`OK  lots=${lots.length}  sample lot 1763 matches Excel ROUND`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
