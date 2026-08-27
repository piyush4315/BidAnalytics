import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./auth";
import { canManageSettings, canManageUsers, canWrite, canDelete, canRecalculate } from "./permissions";

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function assertWrite(user: SessionUser) {
  if (!canWrite(user.role)) throw new Error("You do not have permission to edit records.");
}

export function assertDelete(user: SessionUser) {
  if (!canDelete(user.role)) throw new Error("You do not have permission to delete records.");
}

export function assertSettings(user: SessionUser) {
  if (!canManageSettings(user.role)) throw new Error("Only administrators can change calculation settings.");
}

export function assertUsers(user: SessionUser) {
  if (!canManageUsers(user.role)) throw new Error("Only administrators can manage users.");
}

export function assertRecalc(user: SessionUser) {
  if (!canRecalculate(user.role)) throw new Error("You do not have permission to recalculate financials.");
}
