import { getDashboard } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatINR, formatNumber } from "@/lib/format";
import { AuctionBars, BuyerBars, StatusPie, CollectionBars } from "@/components/charts/DashboardCharts";
import Link from "next/link";

export default async function DashboardPage() {
  const d = await getDashboard();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Receivables desk"
        description="Live position across auctions 21977–21980 imported from the 23.08.2026 combined bid sheet. Figures are calculated, not decorative."
        actions={
          <>
            <Link href="/import" className="rounded-sm bg-white px-3 py-1.5 text-[13px] font-semibold ring-1 ring-stone-300">
              Import sheet
            </Link>
            <Link href="/lots" className="rounded-sm bg-ink-900 px-3 py-1.5 text-[13px] font-semibold text-paper-50">
              Open lots
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Open auctions" value={formatNumber(d.counts.auctions)} hint={`${d.counts.lots} lots · ${d.counts.buyers} buyers`} />
        <KpiCard label="Material value" money={d.materialValue} />
        <KpiCard label="Total receivables" money={d.receivable} tone="info" />
        <KpiCard label="Amount received" money={d.received} tone="good" hint={`${((d.received / (d.receivable || 1)) * 100).toFixed(1)}% collected`} />
        <KpiCard
          label="Outstanding"
          money={d.outstanding}
          tone={d.outstanding > 1 ? "bad" : "good"}
          hint={`${d.counts.fpPending} lots with final payment open`}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="SD pending / partial" value={formatNumber(d.counts.sdPending)} tone={d.counts.sdPending ? "warn" : "good"} />
        <KpiCard label="Final payment pending" value={formatNumber(d.counts.fpPending)} tone={d.counts.fpPending ? "warn" : "good"} />
        <KpiCard label="Short / partial lots" value={formatNumber(d.counts.short)} tone={d.counts.short ? "bad" : "good"} />
        <KpiCard label="Excess payments" value={formatNumber(d.counts.excess)} tone="info" />
        <KpiCard
          label="Docs still open"
          value={`${d.counts.missingInv} inv · ${d.counts.missingSap} SAP`}
          hint="Lots without invoice or SAP document"
          tone="warn"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-sm border border-stone-200 bg-white p-4 shadow-card">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">Received vs outstanding by auction</h2>
          <AuctionBars data={d.byAuction} />
        </article>
        <article className="rounded-sm border border-stone-200 bg-white p-4 shadow-card">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">Outstanding by buyer</h2>
          <BuyerBars data={d.byBuyer} />
        </article>
        <article className="rounded-sm border border-stone-200 bg-white p-4 shadow-card">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">Lot settlement status</h2>
          <StatusPie data={d.statusCounts} />
        </article>
        <article className="rounded-sm border border-stone-200 bg-white p-4 shadow-card">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">Collections by receipt date</h2>
          {d.monthly.length ? <CollectionBars data={d.monthly} /> : <p className="py-16 text-center text-sm text-stone-500">No dated receipts yet.</p>}
        </article>
      </section>

      <article className="rounded-sm border border-stone-200 bg-white shadow-card">
        <header className="border-b border-stone-100 px-4 py-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">Auction position</h2>
        </header>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2 text-left">Auction</th>
                <th className="px-4 py-2 text-right">Lots</th>
                <th className="px-4 py-2 text-right">Material value</th>
                <th className="px-4 py-2 text-right">Receivable</th>
                <th className="px-4 py-2 text-right">Received</th>
                <th className="px-4 py-2 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {d.byAuction.map((a) => (
                <tr key={a.id} className="border-t border-stone-100">
                  <td className="px-4 py-2">
                    <Link href={`/auctions/${a.id}`} className="font-semibold text-copper-800 hover:underline">
                      {a.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular">{a.lots}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px]">{formatINR(a.materialValue)}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px]">{formatINR(a.receivable)}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px]">{formatINR(a.received)}</td>
                  <td className="px-4 py-2 text-right font-mono text-[13px] text-rose-800">{formatINR(a.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
