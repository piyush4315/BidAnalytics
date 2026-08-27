"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertWrite, assertDelete } from "@/lib/require";
import { writeAudit } from "@/lib/audit";

export async function recordPayment(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const lotId = String(formData.get("lotId") || "");
  const type = String(formData.get("type") || "");
  const amount = Number(formData.get("amount") || 0);
  if (!lotId || !["SECURITY_DEPOSIT", "FINAL_PAYMENT", "ADJUSTMENT"].includes(type)) {
    throw new Error("Lot and payment type are required.");
  }
  if (!(amount > 0)) throw new Error("Amount must be greater than zero.");
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new Error("Lot not found.");
  const payment = await prisma.payment.create({
    data: {
      lotId,
      type,
      amount,
      receivedOn: formData.get("receivedOn") ? new Date(String(formData.get("receivedOn"))) : new Date(),
      paymentRef: String(formData.get("paymentRef") || "").trim() || null,
      bankRef: String(formData.get("bankRef") || "").trim() || null,
      remarks: String(formData.get("remarks") || "").trim() || null,
      createdById: user.id,
    },
  });
  await writeAudit({
    userId: user.id,
    entityType: "Payment",
    entityId: payment.id,
    action: "CREATE",
    field: "amount",
    newValue: amount,
    meta: { lotId, type },
  });
  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/deposits");
  revalidatePath("/payments");
  revalidatePath("/receivables");
  revalidatePath("/");
}

export async function deletePayment(id: string) {
  const user = await requireUser();
  assertDelete(user);
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) throw new Error("Payment not found.");
  await prisma.payment.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAudit({
    userId: user.id,
    entityType: "Payment",
    entityId: id,
    action: "SOFT_DELETE",
    oldValue: p.amount,
  });
  revalidatePath(`/lots/${p.lotId}`);
  revalidatePath("/deposits");
  revalidatePath("/payments");
}
