import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { createAuction } from "@/server/actions/masters";
import { AUCTION_STATUSES } from "@/lib/constants";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export default async function AuctionsPage() {
  const user = await requireUser();
  const [auctions, lots] = await Promise.all([
    prisma.auction.findMany({ where: { deletedAt: null }, orderBy: { number: "asc" } }),
    getLots(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Masters"
        title="Auctions"
        description="Each bid sheet number is an auction containing multiple lots."
      />
      <div className="overflow-auto rounded-sm border border-stone-200 bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Auction</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Lots</th>
              <th className="px-3 py-2 text-right">Material value</th>
              <th className="px-3 py-2 text-right">Receivable</th>
              <th className="px-3 py-2 text-right">Received</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => {
              const subset = lots.filter((l) => l.auctionId === a.id);
              const mv = subset.reduce((s, l) => s + l.materialValue, 0);
              const rec = subset.reduce((s, l) => s + l.totalReceivable, 0);
              const recd = subset.reduce((s, l) => s + l.rollup.totalReceived, 0);
              return (
                <tr key={a.id} className="border-t border-stone-100">
                  <td className="px-3 py-2">
                    <Link href={`/auctions/${a.id}`} className="font-semibold text-copper-800 hover:underline">
                      {a.number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{a.title || "—"}</td>
                  <td className="px-3 py-2">{formatDate(a.auctionDate)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={a.status} />
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

      {canWrite(user.role) ? (
        <form action={createAuction} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-4">
          <h2 className="sm:col-span-4 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Add auction</h2>
          <label className="block">
            <span className="text-xs text-stone-500">Auction number</span>
            <input name="number" required className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">Title</span>
            <input name="title" className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">Date</span>
            <input name="auctionDate" type="date" className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">Status</span>
            <select name="status" className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              {AUCTION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div>
            <Button type="submit">Create</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
