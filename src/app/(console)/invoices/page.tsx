import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { InvoicesTable } from "@/components/tables/FinanceTables";
import Link from "next/link";
import { KpiCard } from "@/components/ui/KpiCard";

export default async function InvoicesPage() {
  const [invoices, lots] = await Promise.all([
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { lot: { include: { buyer: true, auction: true } } },
      orderBy: { invoiceNumber: "asc" },
    }),
    getLots(),
  ]);
  const missing = lots.filter((l) => !l.rollup.hasInvoice);
  const rows = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    lotId: inv.lot.id,
    lotNumber: inv.lot.lotNumber,
    auction: inv.lot.auction.number,
    buyer: inv.lot.buyer?.name || "—",
    date: inv.invoiceDate ? inv.invoiceDate.toISOString() : null,
    amount: inv.amount,
    status: inv.status,
  }));
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Documents" title="Invoices" description="Invoice numbers linked to lots. Missing invoices are listed below the register." />
      <section className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="Invoices on file" value={String(invoices.length)} tone="good" />
        <KpiCard label="Lots without invoice" value={String(missing.length)} tone={missing.length ? "warn" : "good"} />
      </section>
      <InvoicesTable rows={rows} />
      {missing.length ? (
        <section>
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Lots without invoice</h2>
          <ul className="columns-1 gap-2 sm:columns-2 lg:columns-3 text-sm">
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
