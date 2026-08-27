import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateLot } from "@/server/actions/lots";
import { UNITS, LOT_STATUSES } from "@/lib/constants";

export default async function EditLotPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  assertWrite(user);
  const lot = await prisma.lot.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!lot) notFound();
  const [auctions, buyers] = await Promise.all([
    prisma.auction.findMany({ where: { deletedAt: null }, orderBy: { number: "asc" } }),
    prisma.buyer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  async function action(formData: FormData) {
    "use server";
    await updateLot(params.id, formData);
    redirect(`/lots/${params.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Lots" title={`Edit lot ${lot.lotNumber}`} />
      <form action={action} className="space-y-4 rounded-sm border border-stone-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Material</span>
            <input name="name" defaultValue={lot.name} className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Auction</span>
            <select name="auctionId" defaultValue={lot.auctionId} className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              {auctions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.number}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Buyer</span>
            <select name="buyerId" defaultValue={lot.buyerId || ""} className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              <option value="">Unassigned</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Status</span>
            <select name="status" defaultValue={lot.status} className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              {LOT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Quantity</span>
            <input name="quantity" type="number" step="0.001" defaultValue={lot.quantity} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Unit</span>
            <select name="unit" defaultValue={lot.unit} className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Rate</span>
            <input name="rate" type="number" step="0.01" defaultValue={lot.rate} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Material value</span>
            <input
              name="materialValue"
              type="number"
              step="0.01"
              defaultValue={lot.materialValue}
              className="mt-1 h-10 w-full rounded-sm border px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">GST TDS rate (e.g. 0.02)</span>
            <input
              name="gstTdsRate"
              type="number"
              step="0.0001"
              defaultValue={lot.gstTdsRate}
              className="mt-1 h-10 w-full rounded-sm border px-3 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Notes</span>
            <input name="notes" defaultValue={lot.notes || ""} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
          </label>
        </div>
        <p className="text-xs text-stone-500">Changing material value or GST TDS rate recalculates expected receivables using current tax settings and writes an audit entry.</p>
        <button className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white">Save changes</button>
      </form>
    </div>
  );
}
