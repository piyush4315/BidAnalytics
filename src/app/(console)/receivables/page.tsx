import { getLots } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { LotsTable } from "@/components/tables/LotsTable";
import { toLotRow } from "@/lib/lot-row";

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const lots = await getLots();
  const status = searchParams.status;
  const filtered = status
    ? lots.filter((l) => {
        if (status === "FULLY_PAID") return l.rollup.settleStatus === "RECEIVED";
        if (status === "PARTIALLY_PAID") return l.rollup.settleStatus === "PARTIAL" || l.rollup.settleStatus === "SHORT";
        if (status === "PENDING") return l.rollup.settleStatus === "PENDING";
        if (status === "SHORT") return l.rollup.outstanding > 1;
        if (status === "EXCESS") return l.rollup.settleStatus === "EXCESS";
        return true;
      })
    : lots;
  const rec = lots.reduce((s, l) => s + l.totalReceivable, 0);
  const recd = lots.reduce((s, l) => s + l.rollup.totalReceived, 0);
  const short = lots.reduce((s, l) => s + Math.max(0, l.rollup.outstanding), 0);
  const excess = lots.reduce((s, l) => s + Math.max(0, -l.rollup.outstanding), 0);
  const sdPend = lots.filter((l) => l.rollup.sdStatus === "PENDING" || l.rollup.sdStatus === "PARTIAL").length;
  const fpPend = lots.filter((l) => l.rollup.fpStatus === "PENDING" || l.rollup.fpStatus === "PARTIAL").length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Collections"
        title="Receivables"
        description="Expected cash from buyers versus receipts. Filter by settlement status."
        actions={<Button href="/api/export/outstanding" variant="secondary">Export outstanding</Button>}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Expected receivables" money={rec} />
        <KpiCard label="Amount received" money={recd} tone="good" />
        <KpiCard label="Outstanding / short" money={short} tone="bad" />
        <KpiCard label="Excess received" money={excess} tone="info" />
      </section>
      <p className="text-sm text-stone-600">
        Security deposits pending/partial: {sdPend} · Final payments pending/partial: {fpPend}
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          ["All", "/receivables"],
          ["Fully paid", "/receivables?status=FULLY_PAID"],
          ["Short / partial", "/receivables?status=SHORT"],
          ["Pending", "/receivables?status=PENDING"],
          ["Excess", "/receivables?status=EXCESS"],
        ].map(([label, href]) => (
          <a key={href} href={href} className="rounded-sm bg-white px-2 py-1 ring-1 ring-stone-200 hover:ring-copper-400">
            {label}
          </a>
        ))}
      </div>
      <LotsTable rows={filtered.map(toLotRow)} />
    </div>
  );
}
