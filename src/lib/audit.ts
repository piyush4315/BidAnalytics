import { prisma } from "./prisma";

export async function writeAudit(input: {
  userId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  meta?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId || null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      field: input.field || null,
      oldValue: input.oldValue === undefined || input.oldValue === null ? null : String(input.oldValue),
      newValue: input.newValue === undefined || input.newValue === null ? null : String(input.newValue),
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export async function auditChanges(
  userId: string | null | undefined,
  entityType: string,
  entityId: string,
  action: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  fields: string[],
) {
  const diffs: { field: string; oldValue: unknown; newValue: unknown }[] = [];
  for (const field of fields) {
    const oldValue = before ? before[field] : undefined;
    const newValue = after[field];
    if (String(oldValue ?? "") !== String(newValue ?? "")) {
      diffs.push({ field, oldValue, newValue });
      await writeAudit({
        userId,
        entityType,
        entityId,
        action,
        field,
        oldValue,
        newValue,
      });
    }
  }
  if (diffs.length === 0 && action === "CREATE") {
    await writeAudit({ userId, entityType, entityId, action, meta: after });
  }
  return diffs;
}
