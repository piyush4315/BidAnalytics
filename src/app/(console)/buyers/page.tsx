import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import Link from "next/link";

export default async function BuyersPage() {
  const user = await requireUser();
  const [buyers, lots] = await Promise.all([
    prisma.buyer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    getLots(),
  ]);
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Masters"
        title="Buyers"
        description="Buyer master with live purchase and outstanding totals."
        actions={canWrite(user.role) ? <Button href="/buyers/new">New buyer</Button> : null}
      />
      <div className="overflow-auto rounded-sm border border-stone-200 bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Buyer</th>
              <th className="px-3 py-2 text-left">GSTIN</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Lots</th>
              <th className="px-3 py-2 text-right">Material value</th>
              <th className="px-3 py-2 text-right">Receivable</th>
              <th className="px-3 py-2 text-right">Received</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => {
              const subset = lots.filter((l) => l.buyerId === b.id);
              const mv = subset.reduce((s, l) => s + l.materialValue, 0);
              const rec = subset.reduce((s, l) => s + l.totalReceivable, 0);
              const recd = subset.reduce((s, l) => s + l.rollup.totalReceived, 0);
              return (
                <tr key={b.id} className="border-t border-stone-100">
                  <td className="px-3 py-2">
                    <Link href={`/buyers/${b.id}`} className="font-semibold text-copper-800 hover:underline">
                      {b.name}
                    </Link>
                    {b.contactPerson ? <p className="text-xs text-stone-500">{b.contactPerson}</p> : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{b.gstNumber || "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td className="px-3 py-2 text-right tabular">{subset.length}</td>
                  <td className="px-3 py-2 text-right">
                    <Money value={mv} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Money value={rec} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Money value={recd} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Money value={rec - recd} tone={rec - recd > 1 ? "short" : "muted"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
