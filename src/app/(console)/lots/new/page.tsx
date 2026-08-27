import { prisma } from "@/lib/prisma";
import { requireUser, assertWrite } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createLot } from "@/server/actions/lots";
import { redirect } from "next/navigation";
import { UNITS, LOT_STATUSES } from "@/lib/constants";
import { getTaxRates } from "@/lib/queries";
import { formatPct } from "@/lib/format";

export default async function NewLotPage() {
  const user = await requireUser();
  assertWrite(user);
  const [auctions, buyers, rates] = await Promise.all([
    prisma.auction.findMany({ where: { deletedAt: null }, orderBy: { number: "asc" } }),
    prisma.buyer.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    getTaxRates(),
  ]);

  async function action(formData: FormData) {
    "use server";
    const id = await createLot(formData);
    redirect(`/lots/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Lots" title="New lot" description="Financials are calculated from current tax configuration when you save." />
      <form action={action} className="space-y-4 rounded-sm border border-stone-200 bg-white p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lot number" name="lotNumber" required />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Auction</label>
            <select name="auctionId" required className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              <option value="">Select auction</option>
              {auctions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.number} {a.title ? `· ${a.title}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Field label="Material / lot name" name="name" required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Buyer</label>
            <select name="buyerId" className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              <option value="">Unassigned</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Status</label>
            <select name="status" defaultValue="SOLD" className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              {LOT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <Field label="Quantity" name="quantity" type="number" step="0.001" required />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Unit</label>
            <select name="unit" defaultValue="NO" className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <Field label="Rate" name="rate" type="number" step="0.01" required />
          <Field label="Material value (leave blank to use qty × rate)" name="materialValue" type="number" step="0.01" />
          <Field
            label={`GST TDS rate (decimal, e.g. 0.02). Default ${formatPct(rates.defaultGstTdsRate)}`}
            name="gstTdsRate"
            type="number"
            step="0.0001"
            defaultValue="0"
          />
        </div>
        <p className="text-xs text-stone-500">
          Current cash factor {formatPct(rates.cashReceivableFactor, 2)} · GST {formatPct(rates.gstRate)} · SD{" "}
          {formatPct(rates.securityDepositRate, 0)}.
        </p>
        <button type="submit" className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-paper-50">
          Create lot
        </button>
      </form>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input
        {...rest}
        className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-3 text-sm outline-none focus:border-copper-500"
      />
    </label>
  );
}
