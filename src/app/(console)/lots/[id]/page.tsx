import { notFound } from "next/navigation";
import Link from "next/link";
import { getLot } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { Money, DiffMoney } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CalcBreakdown } from "@/components/finance/CalcBreakdown";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, formatDateTime, formatQty, formatPct } from "@/lib/format";
import { paymentStatusLabel, type TaxRates, DEFAULT_RATES } from "@/lib/calc";
import { requireUser } from "@/lib/require";
import { canWrite, canDelete, canRecalculate } from "@/lib/permissions";
import { recordPayment, deletePayment } from "@/server/actions/payments";
import { saveInvoice, saveSap } from "@/server/actions/docs";
import { recalculateLot } from "@/server/actions/lots";
import { prisma } from "@/lib/prisma";
import { INVOICE_STATUSES, SAP_STATUSES } from "@/lib/constants";

export default async function LotDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const lot = await getLot(params.id);
  if (!lot) notFound();
  const r = lot.rollup;
  const rates: TaxRates = lot.calcSnapshot ? { ...DEFAULT_RATES, ...JSON.parse(lot.calcSnapshot) } : DEFAULT_RATES;
  const logs = await prisma.auditLog.findMany({
    where: { OR: [{ entityId: lot.id }, { entityId: { in: lot.payments.map((p: { id: string }) => p.id) } }] },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const write = canWrite(user.role);

  const overview = (
    <div className="grid gap-4 lg:grid-cols-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-sm border border-stone-200 bg-white p-4 lg:col-span-2">
        <Item k="Lot number" v={lot.lotNumber} />
        <Item k="Auction" v={<Link href={`/auctions/${lot.auction.id}`} className="text-copper-800 hover:underline">{lot.auction.number}</Link>} />
        <Item
          k="Buyer"
          v={
            lot.buyer ? (
              <Link href={`/buyers/${lot.buyer.id}`} className="text-copper-800 hover:underline">
                {lot.buyer.name}
              </Link>
            ) : (
              "Unassigned"
            )
          }
        />
        <Item k="Status" v={<StatusBadge status={lot.status} />} />
        <Item k="Material" v={lot.name} wide />
        <Item k="Quantity" v={formatQty(lot.quantity, lot.unit)} />
        <Item k="Rate" v={<Money value={lot.rate} />} />
        <Item k="Material value" v={<Money value={lot.materialValue} tone="strong" />} />
        <Item k="GST TDS rate" v={formatPct(lot.gstTdsRate, 2)} />
        {lot.notes ? <Item k="Remarks" v={lot.notes} wide /> : null}
      </dl>
      <div className="space-y-3">
        <Box label="Receivable" value={<Money value={lot.totalReceivable} className="text-lg font-semibold" />} />
        <Box label="Received" value={<Money value={r.totalReceived} className="text-lg font-semibold" />} />
        <Box label="Outstanding" value={<DiffMoney value={r.outstanding} />} />
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={r.sdStatus} label={`SD · ${paymentStatusLabel(r.sdStatus, "sd")}`} />
          <StatusBadge status={r.fpStatus} label={`FP · ${paymentStatusLabel(r.fpStatus, "fp")}`} />
          <StatusBadge status={r.settleStatus} label={paymentStatusLabel(r.settleStatus)} />
        </div>
      </div>
    </div>
  );

  const calc = (
    <CalcBreakdown
      calc={{
        materialValue: lot.materialValue,
        gstTdsRate: lot.gstTdsRate,
        gstAmount: lot.gstAmount,
        materialValueWithGst: lot.materialValueWithGst,
        tcsAmount: lot.tcsAmount,
        tds194O: lot.tds194O,
        serviceChargeGross: lot.serviceChargeGross,
        tds194H: lot.tds194H,
        netServiceCharge: lot.netServiceCharge,
        serviceChargeToMstc: lot.serviceChargeToMstc,
        gstTdsAmount: lot.gstTdsAmount,
        totalReceivable: lot.totalReceivable,
        securityDepositExpected: lot.securityDepositExpected,
        finalPaymentExpected: lot.finalPaymentExpected,
        rates,
      }}
    />
  );

  const deposits = (
    <MoneySection
      expected={lot.securityDepositExpected}
      received={r.sdReceived}
      diff={r.sdDiff}
      date={r.lastSdDate}
      status={r.sdStatus}
      kind="sd"
      lotId={lot.id}
      type="SECURITY_DEPOSIT"
      write={write}
      canRemove={canDelete(user.role)}
      rows={lot.payments.filter((p: { type: string }) => p.type === "SECURITY_DEPOSIT")}
    />
  );

  const payments = (
    <MoneySection
      expected={lot.finalPaymentExpected}
      received={r.fpReceived}
      diff={r.fpDiff}
      date={r.lastFpDate}
      status={r.fpStatus}
      kind="fp"
      lotId={lot.id}
      type="FINAL_PAYMENT"
      write={write}
      canRemove={canDelete(user.role)}
      rows={lot.payments.filter((p: { type: string }) => p.type === "FINAL_PAYMENT")}
    />
  );

  const invoice = (
    <div className="space-y-4">
      {lot.invoices.length === 0 ? (
        <p className="text-sm text-stone-600">No invoice recorded for this lot.</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-sm border border-stone-200 bg-white">
          {lot.invoices.map((inv: { id: string; invoiceNumber: string; invoiceDate: Date | null; amount: number; status: string }) => (
            <li key={inv.id} className="grid gap-2 px-4 py-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-stone-500">Number</p>
                <p className="font-semibold">{inv.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Date</p>
                <p>{formatDate(inv.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Amount</p>
                <Money value={inv.amount} />
              </div>
              <div>
                <StatusBadge status={inv.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {write ? (
        <form action={saveInvoice} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-4">
          <input type="hidden" name="lotId" value={lot.id} />
          <Field name="invoiceNumber" label="Invoice number" required />
          <Field name="invoiceDate" label="Invoice date" type="date" />
          <Field name="amount" label="Amount" type="number" step="0.01" defaultValue={String(lot.totalReceivable)} />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Status</span>
            <select name="status" className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              {INVOICE_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-4">
            <button className="rounded-sm bg-ink-900 px-3 py-2 text-sm font-semibold text-white">Save invoice</button>
          </div>
        </form>
      ) : null}
    </div>
  );

  const sap = (
    <div className="space-y-4">
      {lot.sapDocuments.length === 0 ? (
        <p className="text-sm text-stone-600">No SAP document posted for this lot.</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-sm border border-stone-200 bg-white">
          {lot.sapDocuments.map((d: { id: string; documentNumber: string; documentType: string | null; documentDate: Date | null; amount: number; postingStatus: string }) => (
            <li key={d.id} className="grid gap-2 px-4 py-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-stone-500">Document</p>
                <p className="font-semibold">{d.documentNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Type / date</p>
                <p>
                  {d.documentType || "—"} · {formatDate(d.documentDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Amount</p>
                <Money value={d.amount} />
              </div>
              <StatusBadge status={d.postingStatus} />
            </li>
          ))}
        </ul>
      )}
      {write ? (
        <form action={saveSap} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-4">
          <input type="hidden" name="lotId" value={lot.id} />
          <Field name="documentNumber" label="SAP document number" required />
          <Field name="documentType" label="Document type" defaultValue="DR" />
          <Field name="documentDate" label="Document date" type="date" />
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Posting status</span>
            <select name="postingStatus" className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-2 text-sm">
              {SAP_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-4">
            <button className="rounded-sm bg-ink-900 px-3 py-2 text-sm font-semibold text-white">Save SAP document</button>
          </div>
        </form>
      ) : null}
    </div>
  );

  const activity = (
    <ul className="divide-y divide-stone-100 rounded-sm border border-stone-200 bg-white">
      {logs.length === 0 ? <li className="px-4 py-8 text-sm text-stone-500">No recorded changes yet.</li> : null}
      {logs.map((log) => (
        <li key={log.id} className="px-4 py-2.5 text-sm">
          <p className="font-medium text-stone-800">
            {log.action}
            {log.field ? ` · ${log.field}` : ""}
          </p>
          <p className="text-xs text-stone-500">
            {log.user?.name || "System"} · {formatDateTime(log.createdAt)}
            {log.oldValue || log.newValue ? ` · ${log.oldValue ?? "∅"} → ${log.newValue ?? "∅"}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );

  async function recalc() {
    "use server";
    await recalculateLot(lot.id);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Auction ${lot.auction.number}`}
        title={`Lot ${lot.lotNumber}`}
        description={lot.name}
        actions={
          <>
            {canRecalculate(user.role) ? (
              <form action={recalc}>
                <Button type="submit" variant="secondary">
                  Recalculate
                </Button>
              </form>
            ) : null}
            {write ? (
              <Button href={`/lots/${lot.id}/edit`} variant="secondary">
                Edit
              </Button>
            ) : null}
          </>
        }
      />
      <Tabs
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "calc", label: "Financial calculation", content: calc },
          { id: "sd", label: "Security deposit", content: deposits },
          { id: "fp", label: "Final payment", content: payments },
          { id: "inv", label: "Invoice", content: invoice },
          { id: "sap", label: "SAP", content: sap },
          { id: "activity", label: "Activity", content: activity },
        ]}
      />
    </div>
  );
}

function Item({ k, v, wide }: { k: string; v: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{k}</dt>
      <dd className="mt-0.5 text-sm text-stone-900">{v}</dd>
    </div>
  );
}

function Box({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-stone-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input {...rest} className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-3 text-sm" />
    </label>
  );
}

function MoneySection({
  expected,
  received,
  diff,
  date,
  status,
  kind,
  lotId,
  type,
  write,
  canRemove,
  rows,
}: {
  expected: number;
  received: number;
  diff: number;
  date: Date | null;
  status: string;
  kind: "sd" | "fp";
  lotId: string;
  type: string;
  write: boolean;
  canRemove: boolean;
  rows: {
    id: string;
    amount: number;
    receivedOn: Date | null;
    paymentRef: string | null;
    bankRef: string | null;
    remarks: string | null;
    createdBy?: { name: string } | null;
  }[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Box label="Expected" value={<Money value={expected} className="text-lg" />} />
        <Box label="Received" value={<Money value={received} className="text-lg" />} />
        <Box label="Difference" value={<DiffMoney value={diff} />} />
        <Box
          label="Status"
          value={
            <div>
              <StatusBadge status={status} label={paymentStatusLabel(status as never, kind)} />
              <p className="mt-1 text-xs text-stone-500">{formatDate(date)}</p>
            </div>
          }
        />
      </div>
      <div className="overflow-auto rounded-sm border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Payment ref</th>
              <th className="px-3 py-2 text-left">Bank ref</th>
              <th className="px-3 py-2 text-left">Remarks</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-stone-500">
                  No receipts recorded.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="px-3 py-2">{formatDate(p.receivedOn)}</td>
                  <td className="px-3 py-2 text-right">
                    <Money value={p.amount} paise />
                  </td>
                  <td className="px-3 py-2">{p.paymentRef || "—"}</td>
                  <td className="px-3 py-2">{p.bankRef || "—"}</td>
                  <td className="px-3 py-2 text-stone-600">{p.remarks || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {canRemove ? (
                      <form
                        action={async () => {
                          "use server";
                          await deletePayment(p.id);
                        }}
                      >
                        <button className="text-xs font-semibold text-rose-700">Remove</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {write ? (
        <form action={recordPayment} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <input type="hidden" name="lotId" value={lotId} />
          <input type="hidden" name="type" value={type} />
          <Field name="amount" label="Amount received" type="number" step="0.01" required />
          <Field name="receivedOn" label="Receipt date" type="date" />
          <Field name="paymentRef" label="Payment reference" />
          <Field name="bankRef" label="Bank reference" />
          <Field name="remarks" label="Remarks" />
          <div className="flex items-end">
            <button className="h-10 rounded-sm bg-ink-900 px-3 text-sm font-semibold text-white">Record receipt</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
