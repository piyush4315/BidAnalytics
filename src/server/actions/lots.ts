"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertWrite, assertRecalc } from "@/lib/require";
import { writeAudit, auditChanges } from "@/lib/audit";
import { calculateLotFinancials, applyCalculation } from "@/lib/calc";
import { getTaxRates } from "@/lib/queries";

async function persistCalc(lotId: string, materialValue: number, gstTdsRate: number, rates = undefined as Awaited<ReturnType<typeof getTaxRates>> | undefined) {
  const r = rates || (await getTaxRates());
  const calc = calculateLotFinancials(materialValue, gstTdsRate, r);
  await prisma.lot.update({
    where: { id: lotId },
    data: {
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
  return calc;
}

export async function createLot(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const lotNumber = String(formData.get("lotNumber") || "").trim();
  const auctionId = String(formData.get("auctionId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const quantity = Number(formData.get("quantity") || 0);
  const unit = String(formData.get("unit") || "NO");
  const rate = Number(formData.get("rate") || 0);
  const materialValueRaw = formData.get("materialValue");
  const materialValue = materialValueRaw ? Number(materialValueRaw) : Number((quantity * rate).toFixed(2));
  const gstTdsRate = Number(formData.get("gstTdsRate") || 0);
  if (!lotNumber || !auctionId || !name) throw new Error("Lot number, auction and material are required.");
  const dup = await prisma.lot.findFirst({ where: { lotNumber, deletedAt: null } });
  if (dup) throw new Error("Lot number already exists.");
  const auction = await prisma.auction.findFirst({ where: { id: auctionId, deletedAt: null } });
  if (!auction) throw new Error("Auction not found.");
  const buyerId = String(formData.get("buyerId") || "") || null;
  const rates = await getTaxRates();
  const calc = calculateLotFinancials(materialValue, gstTdsRate, rates);
  const lot = await prisma.lot.create({
    data: applyCalculation(
      {
        lotNumber,
        auctionId,
        buyerId,
        name,
        quantity,
        unit,
        status: String(formData.get("status") || "SOLD"),
        rate,
        materialValue,
        gstTdsRate,
        notes: String(formData.get("notes") || "").trim() || null,
      },
      calc,
    ) as never,
  });
  await writeAudit({ userId: user.id, entityType: "Lot", entityId: lot.id, action: "CREATE", newValue: lotNumber });
  revalidatePath("/lots");
  return lot.id;
}

export async function updateLot(id: string, formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const before = await prisma.lot.findUnique({ where: { id } });
  if (!before) throw new Error("Lot not found.");
  const quantity = Number(formData.get("quantity") ?? before.quantity);
  const rate = Number(formData.get("rate") ?? before.rate);
  const materialValue = Number(formData.get("materialValue") ?? before.materialValue);
  const gstTdsRate = Number(formData.get("gstTdsRate") ?? before.gstTdsRate);
  const buyerId = String(formData.get("buyerId") || "") || null;
  const data = {
    name: String(formData.get("name") || before.name),
    quantity,
    unit: String(formData.get("unit") || before.unit),
    status: String(formData.get("status") || before.status),
    rate,
    materialValue,
    gstTdsRate,
    buyerId,
    notes: String(formData.get("notes") || "").trim() || null,
    auctionId: String(formData.get("auctionId") || before.auctionId),
  };
  await prisma.lot.update({ where: { id }, data });
  if (materialValue !== before.materialValue || gstTdsRate !== before.gstTdsRate) {
    await persistCalc(id, materialValue, gstTdsRate);
  }
  await auditChanges(user.id, "Lot", id, "UPDATE", before as never, data as never, [
    "name",
    "quantity",
    "unit",
    "status",
    "rate",
    "materialValue",
    "gstTdsRate",
    "buyerId",
  ]);
  revalidatePath("/lots");
  revalidatePath(`/lots/${id}`);
}

export async function recalculateLot(id: string) {
  const user = await requireUser();
  assertRecalc(user);
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot) throw new Error("Lot not found.");
  const before = lot.totalReceivable;
  const calc = await persistCalc(id, lot.materialValue, lot.gstTdsRate);
  await writeAudit({
    userId: user.id,
    entityType: "Lot",
    entityId: id,
    action: "RECALCULATE",
    field: "totalReceivable",
    oldValue: before,
    newValue: calc.totalReceivable,
  });
  revalidatePath(`/lots/${id}`);
  revalidatePath("/lots");
}

export async function recalculateAllLots() {
  const user = await requireUser();
  assertRecalc(user);
  const rates = await getTaxRates();
  const lots = await prisma.lot.findMany({ where: { deletedAt: null } });
  for (const lot of lots) {
    await persistCalc(lot.id, lot.materialValue, lot.gstTdsRate, rates);
  }
  await writeAudit({
    userId: user.id,
    entityType: "TaxConfig",
    entityId: "all",
    action: "RECALCULATE_ALL",
    meta: { count: lots.length },
  });
  revalidatePath("/");
  revalidatePath("/lots");
  revalidatePath("/settings");
}
