import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { FinalPaymentsTable } from "@/components/tables/FinanceTables";

export default async function PaymentsPage() {
  const lots = await getLots();
  const rows = lots.map((l) => ({
    id: l.id,
    lotNumber: l.lotNumber,
    buyer: l.buyer?.name || "—",
    auction: l.auction.number,
    expected: l.finalPaymentExpected,
    received: l.rollup.fpReceived,
    diff: l.rollup.fpDiff,
    status: l.rollup.fpStatus,
    date: l.rollup.lastFpDate ? l.rollup.lastFpDate.toISOString() : null,
    remark: l.notes,
  }));
  const expected = rows.reduce((s, r) => s + r.expected, 0);
  const received = rows.reduce((s, r) => s + r.received, 0);
  const pending = rows.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Collections"
        title="Final payments"
        description="Final payment expected is cash receivable minus security deposit expected, after GST TDS."
      />
      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Expected" money={expected} />
        <KpiCard label="Received" money={received} tone="good" />
        <KpiCard label="Lots still pending" value={String(pending)} tone={pending ? "warn" : "good"} />
      </section>
      <FinalPaymentsTable rows={rows} />
    </div>
  );
}
