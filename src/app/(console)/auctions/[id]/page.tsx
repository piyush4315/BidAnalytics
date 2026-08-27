import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { LotsTable } from "@/components/tables/LotsTable";
import { toLotRow } from "@/lib/lot-row";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { updateAuction } from "@/server/actions/masters";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { AUCTION_STATUSES } from "@/lib/constants";
import Link from "next/link";

export default async function AuctionDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const auction = await prisma.auction.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!auction) notFound();
  const lots = (await getLots()).filter((l) => l.auctionId === auction.id);
  const mv = lots.reduce((s, l) => s + l.materialValue, 0);
  const rec = lots.reduce((s, l) => s + l.totalReceivable, 0);
  const recd = lots.reduce((s, l) => s + l.rollup.totalReceived, 0);
  const buyers = Array.from(new Map(lots.filter((l) => l.buyer).map((l) => [l.buyer!.id, l.buyer!])).values());

  async function save(formData: FormData) {
    "use server";
    await updateAuction(params.id, formData);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Auction"
        title={auction.number}
        description={auction.title || auction.description || "Bid sheet"}
      />
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={auction.status} />
        <span className="text-sm text-stone-500">{formatDate(auction.auctionDate)}</span>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Lots" value={String(lots.length)} />
        <KpiCard label="Material value" money={mv} />
        <KpiCard label="Receivable" money={rec} />
        <KpiCard label="Received" money={recd} tone="good" />
        <KpiCard label="Outstanding" money={rec - recd} tone={rec - recd > 1 ? "bad" : "good"} />
      </section>
      <section>
        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Participating buyers</h2>
        <div className="flex flex-wrap gap-2">
          {buyers.map((b) => (
            <Link key={b.id} href={`/buyers/${b.id}`} className="rounded-sm bg-white px-2 py-1 text-sm ring-1 ring-stone-200 hover:ring-copper-400">
              {b.name}
            </Link>
          ))}
        </div>
      </section>
      <LotsTable rows={lots.map(toLotRow)} />
      {canWrite(user.role) ? (
        <form action={save} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-stone-500">Title</span>
            <input name="title" defaultValue={auction.title || ""} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">Status</span>
            <select name="status" defaultValue={auction.status} className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              {AUCTION_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-stone-500">Date</span>
            <input
              name="auctionDate"
              type="date"
              defaultValue={auction.auctionDate ? auction.auctionDate.toISOString().slice(0, 10) : ""}
              className="mt-1 h-10 w-full rounded-sm border px-3 text-sm"
            />
          </label>
          <label className="sm:col-span-3 block">
            <span className="text-xs text-stone-500">Notes</span>
            <input name="notes" defaultValue={auction.notes || ""} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <button className="h-10 rounded-sm bg-ink-900 px-3 text-sm font-semibold text-white">Save auction</button>
        </form>
      ) : null}
    </div>
  );
}
