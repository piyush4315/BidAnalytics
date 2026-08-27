"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertWrite } from "@/lib/require";
import { writeAudit } from "@/lib/audit";

export async function saveInvoice(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const lotId = String(formData.get("lotId") || "");
  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  if (!lotId || !invoiceNumber) throw new Error("Lot and invoice number are required.");
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new Error("Lot not found.");
  const existingId = String(formData.get("id") || "");
  const data = {
    lotId,
    invoiceNumber,
    invoiceDate: formData.get("invoiceDate") ? new Date(String(formData.get("invoiceDate"))) : null,
    amount: formData.get("amount") ? Number(formData.get("amount")) : lot.totalReceivable,
    status: String(formData.get("status") || "GENERATED"),
    remarks: String(formData.get("remarks") || "").trim() || null,
  };
  if (existingId) {
    await prisma.invoice.update({ where: { id: existingId }, data });
    await writeAudit({ userId: user.id, entityType: "Invoice", entityId: existingId, action: "UPDATE", newValue: invoiceNumber });
  } else {
    const inv = await prisma.invoice.create({ data });
    await writeAudit({ userId: user.id, entityType: "Invoice", entityId: inv.id, action: "CREATE", newValue: invoiceNumber });
  }
  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/invoices");
}

export async function saveSap(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const lotId = String(formData.get("lotId") || "");
  const documentNumber = String(formData.get("documentNumber") || "").trim();
  if (!lotId || !documentNumber) throw new Error("Lot and SAP document number are required.");
  const lot = await prisma.lot.findFirst({ where: { id: lotId, deletedAt: null } });
  if (!lot) throw new Error("Lot not found.");
  const existingId = String(formData.get("id") || "");
  const invoiceId = String(formData.get("invoiceId") || "") || null;
  const data = {
    lotId,
    invoiceId,
    documentNumber,
    documentType: String(formData.get("documentType") || "").trim() || "DR",
    documentDate: formData.get("documentDate") ? new Date(String(formData.get("documentDate"))) : null,
    amount: formData.get("amount") ? Number(formData.get("amount")) : lot.totalReceivable,
    postingStatus: String(formData.get("postingStatus") || "POSTED"),
    remarks: String(formData.get("remarks") || "").trim() || null,
  };
  if (existingId) {
    await prisma.sapDocument.update({ where: { id: existingId }, data });
    await writeAudit({ userId: user.id, entityType: "SapDocument", entityId: existingId, action: "UPDATE", newValue: documentNumber });
  } else {
    const doc = await prisma.sapDocument.create({ data });
    await writeAudit({ userId: user.id, entityType: "SapDocument", entityId: doc.id, action: "CREATE", newValue: documentNumber });
  }
  revalidatePath(`/lots/${lotId}`);
  revalidatePath("/sap");
}
