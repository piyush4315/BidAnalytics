import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { SapTable } from "@/components/tables/FinanceTables";
import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";

export default async function SapPage() {
  const [docs, lots] = await Promise.all([
    prisma.sapDocument.findMany({
      where: { deletedAt: null },
      include: { lot: { include: { buyer: true, auction: true } }, invoice: true },
      orderBy: { documentNumber: "asc" },
    }),
    getLots(),
  ]);
  const missing = lots.filter((l) => !l.rollup.hasSap);
  const pending = docs.filter((d) => d.postingStatus === "PENDING");
  const rows = docs.map((d) => ({
    id: d.id,
    documentNumber: d.documentNumber,
    type: d.documentType,
    lotId: d.lot.id,
    lotNumber: d.lot.lotNumber,
    auction: d.lot.auction.number,
    buyer: d.lot.buyer?.name || "—",
    invoice: d.invoice?.invoiceNumber || "—",
    date: d.documentDate ? d.documentDate.toISOString() : null,
    amount: d.amount,
    status: d.postingStatus,
  }));
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Documents" title="SAP documents" description="Posted documents, pending postings, and lots still without a SAP number." />
      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Documents on file" value={String(docs.length)} tone="good" />
        <KpiCard label="Pending posting" value={String(pending.length)} tone={pending.length ? "warn" : "good"} />
        <KpiCard label="Lots without SAP" value={String(missing.length)} tone={missing.length ? "warn" : "good"} />
      </section>
      <SapTable rows={rows} />
      {missing.length ? (
        <section>
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Lots without SAP document</h2>
          <ul className="columns-1 sm:columns-2 lg:columns-3 text-sm">
            {missing.map((l) => (
              <li key={l.id} className="mb-1">
                <Link href={`/lots/${l.id}`} className="text-copper-800 hover:underline">
                  Lot {l.lotNumber}
                </Link>{" "}
                <span className="text-stone-500">· {l.buyer?.name}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
