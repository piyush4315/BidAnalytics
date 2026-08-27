export const ROLES = ["ADMIN", "MANAGER", "DATA_ENTRY", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export function canWrite(role: string) {
  return role === "ADMIN" || role === "MANAGER" || role === "DATA_ENTRY";
}

export function canDelete(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}

export function canManageSettings(role: string) {
  return role === "ADMIN";
}

export function canManageUsers(role: string) {
  return role === "ADMIN";
}

export function canRecalculate(role: string) {
  return role === "ADMIN" || role === "MANAGER";
}

export function roleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MANAGER":
      return "Manager";
    case "DATA_ENTRY":
      return "Data entry";
    case "VIEWER":
      return "Viewer";
    default:
      return role;
  }
}
