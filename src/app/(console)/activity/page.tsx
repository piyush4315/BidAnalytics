import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";

export default async function ActivityPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Control" title="Audit trail" description="Who created or changed a record, which field moved, and when." />
      <div className="overflow-auto rounded-sm border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Field</th>
              <th className="px-3 py-2 text-left">From</th>
              <th className="px-3 py-2 text-left">To</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="whitespace-nowrap px-3 py-2 text-stone-500">{formatDateTime(l.createdAt)}</td>
                <td className="px-3 py-2">{l.user?.name || "System"}</td>
                <td className="px-3 py-2 font-medium">{l.action}</td>
                <td className="px-3 py-2">
                  {l.entityType}
                  <span className="block font-mono text-[11px] text-stone-400">{l.entityId.slice(0, 10)}</span>
                </td>
                <td className="px-3 py-2">{l.field || "—"}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-stone-500" title={l.oldValue || ""}>
                  {l.oldValue || "—"}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2" title={l.newValue || ""}>
                  {l.newValue || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
