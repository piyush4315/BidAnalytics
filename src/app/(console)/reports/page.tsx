import { getLots, getDashboard } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { PrintButton } from "@/components/ui/PrintButton";
import { formatINR } from "@/lib/format";
import { Money, DiffMoney } from "@/components/ui/Money";
import Link from "next/link";

export default async function ReportsPage() {
  const [lots, dash] = await Promise.all([getLots(), getDashboard()]);
  const shortLots = lots.filter((l) => Math.abs(l.rollup.outstanding) > 1);
  const sdOpen = lots.filter((l) => l.rollup.sdStatus !== "RECEIVED" && l.rollup.sdStatus !== "EXCESS");

  return (
    <div className="space-y-8 print-full">
      <PageHeader
        eyebrow="Reporting"
        title="Operating reports"
        description="Print this page for a PDF, or export Excel workbooks from the buttons."
        actions={
          <>
            <Button href="/api/export/auction-summary" variant="secondary">
              Auction Excel
            </Button>
            <Button href="/api/export/buyer-summary" variant="secondary">
              Buyer Excel
            </Button>
            <Button href="/api/export/outstanding" variant="secondary">
              Outstanding Excel
            </Button>
            <PrintButton />
          </>
        }
      />

      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <h2 className="font-display text-xl">Auction summary</h2>
        </header>
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Auction</th>
              <th className="px-3 py-2 text-right">Lots</th>
              <th className="px-3 py-2 text-right">Material value</th>
              <th className="px-3 py-2 text-right">Receivable</th>
              <th className="px-3 py-2 text-right">Received</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {dash.byAuction.map((a) => (
              <tr key={a.id} className="border-t border-stone-100">
                <td className="px-3 py-2">
                  <Link href={`/auctions/${a.id}`} className="font-semibold text-copper-800">
                    {a.number}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">{a.lots}</td>
                <td className="px-3 py-2 text-right font-mono text-[13px]">{formatINR(a.materialValue)}</td>
                <td className="px-3 py-2 text-right font-mono text-[13px]">{formatINR(a.receivable)}</td>
                <td className="px-3 py-2 text-right font-mono text-[13px]">{formatINR(a.received)}</td>
                <td className="px-3 py-2 text-right font-mono text-[13px]">{formatINR(a.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-display text-xl">Buyer summary</h2>
        </header>
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Buyer</th>
              <th className="px-3 py-2 text-right">Lots</th>
              <th className="px-3 py-2 text-right">Receivable</th>
              <th className="px-3 py-2 text-right">Paid</th>
              <th className="px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {dash.byBuyer.map((b) => (
              <tr key={b.name} className="border-t border-stone-100">
                <td className="px-3 py-2">{b.name}</td>
                <td className="px-3 py-2 text-right">{b.lots}</td>
                <td className="px-3 py-2 text-right">
                  <Money value={b.receivable} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={b.received} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={b.outstanding} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-display text-xl">Short / excess & outstanding lots</h2>
        </header>
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Lot</th>
              <th className="px-3 py-2 text-left">Buyer</th>
              <th className="px-3 py-2 text-right">Expected</th>
              <th className="px-3 py-2 text-right">Received</th>
              <th className="px-3 py-2 text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {shortLots.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <td className="px-3 py-2">
                  <Link href={`/lots/${l.id}`} className="font-semibold text-copper-800">
                    {l.lotNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">{l.buyer?.name}</td>
                <td className="px-3 py-2 text-right">
                  <Money value={l.totalReceivable} />
                </td>
                <td className="px-3 py-2 text-right">
                  <Money value={l.rollup.totalReceived} />
                </td>
                <td className="px-3 py-2 text-right">
                  <DiffMoney value={l.rollup.outstanding} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-display text-xl">Security deposit — pending</h2>
        </header>
        {sdOpen.length === 0 ? (
          <p className="px-4 py-6 text-sm text-stone-600">All security deposits are fully received.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {sdOpen.map((l) => (
              <li key={l.id} className="flex justify-between px-4 py-2 text-sm">
                <Link href={`/lots/${l.id}`} className="text-copper-800">
                  Lot {l.lotNumber} · {l.buyer?.name}
                </Link>
                <DiffMoney value={l.rollup.sdDiff} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-display text-xl">SAP tracking</h2>
        </header>
        <p className="px-4 py-3 text-sm text-stone-600">
          {lots.filter((l) => l.rollup.hasSap).length} lots with SAP documents · {lots.filter((l) => !l.rollup.hasSap).length} without ·{" "}
          {lots.filter((l) => l.rollup.hasInvoice).length} with invoice · {lots.filter((l) => !l.rollup.hasInvoice).length} without invoice.
        </p>
      </section>
    </div>
  );
}
