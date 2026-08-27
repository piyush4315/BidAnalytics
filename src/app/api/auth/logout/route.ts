import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await writeAudit({ userId: user.id, entityType: "User", entityId: user.id, action: "LOGOUT" });
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
