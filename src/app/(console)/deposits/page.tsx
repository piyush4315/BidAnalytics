import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { DepositsTable } from "@/components/tables/FinanceTables";

export default async function DepositsPage() {
  const lots = await getLots();
  const rows = lots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    buyer: l.buyer?.name || "—",
    auction: l.auction.number,
    expected: l.securityDepositExpected,
    received: l.rollup.sdReceived,
    diff: l.rollup.sdDiff,
    status: l.rollup.sdStatus,
    date: l.rollup.lastSdDate ? l.rollup.lastSdDate.toISOString() : null,
  }));
  const expected = rows.reduce((s, r) => s + r.expected, 0);
  const received = rows.reduce((s, r) => s + r.received, 0);
  const pending = rows.filter((r) => r.status === "PENDING" || r.status === "PARTIAL").length;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Collections" title="Security deposits" description="Expected 25% of material value versus receipts." />
      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Expected" money={expected} />
        <KpiCard label="Received" money={received} tone="good" />
        <KpiCard label="Lots pending / partial" value={String(pending)} tone={pending ? "warn" : "good"} />
      </section>
      <DepositsTable rows={rows} />
    </div>
  );
}
