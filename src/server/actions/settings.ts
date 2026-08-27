"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, assertSettings, assertUsers } from "@/lib/require";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";

export async function updateTaxConfig(formData: FormData) {
  const user = await requireUser();
  assertSettings(user);
  const pct = (key: string, fallback: number) => {
    const raw = formData.get(key);
    if (raw === null || raw === "") return fallback;
    return Number(raw) / 100;
  };
  const cfg = await prisma.taxConfig.findFirst({ orderBy: { createdAt: "desc" } });
  const data = {
    gstRate: pct("gstRate", 18),
    tcsRate: pct("tcsRate", 2),
    tds194ORate: pct("tds194ORate", 0.1),
    serviceChargeRate: pct("serviceChargeRate", 2.25),
    serviceChargeGstFactor: Number(formData.get("serviceChargeGstFactor") || 1.18),
    tds194HRate: pct("tds194HRate", 2),
    cashReceivableFactor: pct("cashReceivableFactor", 117.65),
    securityDepositRate: pct("securityDepositRate", 25),
    defaultGstTdsRate: pct("defaultGstTdsRate", 0),
    notes: String(formData.get("notes") || "").trim() || null,
    updatedById: user.id,
  };
  if (cfg) await prisma.taxConfig.update({ where: { id: cfg.id }, data });
  else await prisma.taxConfig.create({ data });
  await writeAudit({ userId: user.id, entityType: "TaxConfig", entityId: cfg?.id || "new", action: "UPDATE", meta: data });
  revalidatePath("/settings");
}

export async function createUser(formData: FormData) {
  const user = await requireUser();
  assertUsers(user);
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "VIEWER");
  if (!email || !name || password.length < 8) throw new Error("Name, email and a password of 8+ characters are required.");
  if (!ROLES.includes(role as never)) throw new Error("Invalid role.");
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("Email already in use.");
  const created = await prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password), isActive: true },
  });
  await writeAudit({ userId: user.id, entityType: "User", entityId: created.id, action: "CREATE", newValue: email });
  revalidatePath("/admin");
}

export async function toggleUser(id: string) {
  const user = await requireUser();
  assertUsers(user);
  if (user.id === id) throw new Error("You cannot deactivate your own account.");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("User not found.");
  await prisma.user.update({ where: { id }, data: { isActive: !target.isActive } });
  await writeAudit({
    userId: user.id,
    entityType: "User",
    entityId: id,
    action: "UPDATE",
    field: "isActive",
    oldValue: target.isActive,
    newValue: !target.isActive,
  });
  revalidatePath("/admin");
}
