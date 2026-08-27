"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertWrite, assertDelete } from "@/lib/require";
import { writeAudit } from "@/lib/audit";
import { AUCTION_STATUSES } from "@/lib/constants";

export async function createAuction(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const number = String(formData.get("number") || "").trim();
  if (!number) throw new Error("Auction number is required.");
  const existing = await prisma.auction.findUnique({ where: { number } });
  if (existing && !existing.deletedAt) throw new Error("Auction number already exists.");
  const auction = await prisma.auction.create({
    data: {
      number,
      title: String(formData.get("title") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      status: AUCTION_STATUSES.includes(String(formData.get("status")) as never)
        ? String(formData.get("status"))
        : "OPEN",
      auctionDate: formData.get("auctionDate") ? new Date(String(formData.get("auctionDate"))) : null,
    },
  });
  await writeAudit({ userId: user.id, entityType: "Auction", entityId: auction.id, action: "CREATE", newValue: number });
  revalidatePath("/auctions");
  return auction.id;
}

export async function updateAuction(id: string, formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const before = await prisma.auction.findUnique({ where: { id } });
  if (!before) throw new Error("Auction not found.");
  const data = {
    title: String(formData.get("title") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    status: String(formData.get("status") || before.status),
    auctionDate: formData.get("auctionDate") ? new Date(String(formData.get("auctionDate"))) : before.auctionDate,
    notes: String(formData.get("notes") || "").trim() || null,
  };
  await prisma.auction.update({ where: { id }, data });
  await writeAudit({
    userId: user.id,
    entityType: "Auction",
    entityId: id,
    action: "UPDATE",
    field: "status",
    oldValue: before.status,
    newValue: data.status,
  });
  revalidatePath("/auctions");
  revalidatePath(`/auctions/${id}`);
}

export async function createBuyer(formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Buyer name is required.");
  const existing = await prisma.buyer.findFirst({ where: { name, deletedAt: null } });
  if (existing) throw new Error("A buyer with this name already exists.");
  const buyer = await prisma.buyer.create({
    data: {
      name,
      contactPerson: String(formData.get("contactPerson") || "").trim() || null,
      mobile: String(formData.get("mobile") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      gstNumber: String(formData.get("gstNumber") || "").trim() || null,
      pan: String(formData.get("pan") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      pincode: String(formData.get("pincode") || "").trim() || null,
      bankName: String(formData.get("bankName") || "").trim() || null,
      bankAccount: String(formData.get("bankAccount") || "").trim() || null,
      ifsc: String(formData.get("ifsc") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    },
  });
  await writeAudit({ userId: user.id, entityType: "Buyer", entityId: buyer.id, action: "CREATE", newValue: name });
  revalidatePath("/buyers");
  return buyer.id;
}

export async function updateBuyer(id: string, formData: FormData) {
  const user = await requireUser();
  assertWrite(user);
  const before = await prisma.buyer.findUnique({ where: { id } });
  if (!before) throw new Error("Buyer not found.");
  await prisma.buyer.update({
    where: { id },
    data: {
      contactPerson: String(formData.get("contactPerson") || "").trim() || null,
      mobile: String(formData.get("mobile") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      gstNumber: String(formData.get("gstNumber") || "").trim() || null,
      pan: String(formData.get("pan") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      state: String(formData.get("state") || "").trim() || null,
      pincode: String(formData.get("pincode") || "").trim() || null,
      bankName: String(formData.get("bankName") || "").trim() || null,
      bankAccount: String(formData.get("bankAccount") || "").trim() || null,
      ifsc: String(formData.get("ifsc") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      isActive: formData.get("isActive") === "true",
    },
  });
  await writeAudit({ userId: user.id, entityType: "Buyer", entityId: id, action: "UPDATE" });
  revalidatePath("/buyers");
  revalidatePath(`/buyers/${id}`);
}

export async function softDelete(entity: "auction" | "buyer" | "lot", id: string) {
  const user = await requireUser();
  assertDelete(user);
  if (entity === "auction") {
    await prisma.auction.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAudit({ userId: user.id, entityType: "Auction", entityId: id, action: "SOFT_DELETE" });
    revalidatePath("/auctions");
  } else if (entity === "buyer") {
    await prisma.buyer.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAudit({ userId: user.id, entityType: "Buyer", entityId: id, action: "SOFT_DELETE" });
    revalidatePath("/buyers");
  } else {
    await prisma.lot.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAudit({ userId: user.id, entityType: "Lot", entityId: id, action: "SOFT_DELETE" });
    revalidatePath("/lots");
  }
}
