import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/require";
import { canManageSettings, canRecalculate } from "@/lib/permissions";
import { updateTaxConfig } from "@/server/actions/settings";
import { recalculateAllLots } from "@/server/actions/lots";
import { DEFAULT_RATES } from "@/lib/calc";

export default async function SettingsPage() {
  const user = await requireUser();
  const cfg = (await prisma.taxConfig.findFirst({ orderBy: { createdAt: "desc" } })) || DEFAULT_RATES;
  const admin = canManageSettings(user.role);
  const pct = (n: number, d = 2) => (n * 100).toFixed(d);

  async function recalc() {
    "use server";
    await recalculateAllLots();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Calculation settings"
        description="Rates drive new lots and recalculation. Existing lots keep their snapshot until an authorised user recalculates."
      />
      <form action={updateTaxConfig} className="grid gap-4 rounded-sm border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <Rate name="gstRate" label="GST %" defaultValue={pct(cfg.gstRate)} disabled={!admin} />
        <Rate name="tcsRate" label="TCS %" defaultValue={pct(cfg.tcsRate)} disabled={!admin} />
        <Rate name="tds194ORate" label="TDS 194(O) %" defaultValue={pct(cfg.tds194ORate, 2)} disabled={!admin} />
        <Rate name="serviceChargeRate" label="Service charge %" defaultValue={pct(cfg.serviceChargeRate, 2)} disabled={!admin} />
        <Rate
          name="serviceChargeGstFactor"
          label="Service charge GST factor (1.18 = 118%)"
          defaultValue={String(cfg.serviceChargeGstFactor)}
          disabled={!admin}
        />
        <Rate name="tds194HRate" label="TDS 194(H) %" defaultValue={pct(cfg.tds194HRate)} disabled={!admin} />
        <Rate
          name="cashReceivableFactor"
          label="Cash receivable factor %"
          defaultValue={pct(cfg.cashReceivableFactor, 2)}
          disabled={!admin}
        />
        <Rate name="securityDepositRate" label="Security deposit %" defaultValue={pct(cfg.securityDepositRate, 0)} disabled={!admin} />
        <Rate name="defaultGstTdsRate" label="Default GST TDS %" defaultValue={pct(cfg.defaultGstTdsRate, 2)} disabled={!admin} />
        <label className="sm:col-span-2 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Notes</span>
          <textarea
            name="notes"
            defaultValue={"notes" in cfg ? cfg.notes || "" : ""}
            disabled={!admin}
            rows={3}
            className="mt-1 w-full rounded-sm border px-3 py-2 text-sm"
          />
        </label>
        {admin ? (
          <button className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white">Save rates</button>
        ) : (
          <p className="text-sm text-stone-600">Only administrators can change rates.</p>
        )}
      </form>

      {canRecalculate(user.role) ? (
        <form action={recalc} className="rounded-sm border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-950">
            Recalculate every open lot with the saved rates. This overwrites expected receivables, deposits and final
            payments. Receipts are not changed. The action is written to the audit trail.
          </p>
          <button className="mt-3 rounded-sm bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white">Recalculate all lots</button>
        </form>
      ) : null}

      <article className="rounded-sm border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-700">
        <h2 className="font-display text-lg text-stone-900">How cash receivable is derived</h2>
        <p className="mt-2">
          The Combined Bid Sheet does not spell out a statutory identity for 117.65%. The Working sheet uses 117.65 as a
          base percentage and subtracts the lot GST TDS percentage from it. The Final Calculation Sheet implements:
        </p>
        <pre className="mt-2 overflow-auto bg-paper-50 p-3 font-mono text-[12px]">
{`GST                 = ROUND(MV × GST%, 0)
TCS                 = ROUND((MV + GST) × TCS%, 0)
TDS 194(O)          = MV × 0.10%
SC gross            = MV × 2.25% × 118%
TDS 194(H)          = MV × 2.25% × 2%
SC to MSTC          = ROUND(SC gross − TDS 194(H) + TDS 194(O), 0)
GST TDS             = ROUND(MV × lot GST TDS rate, 0)
Total cash recv.    = ROUND(MV × 117.65% − GST TDS, 0)
SD expected         = ROUND(MV × 25%, 0)
FP expected         = ROUND(MV × 92.65% − GST TDS, 0)
Short/(excess)      = Total cash recv. − SD received − FP received`}
        </pre>
        <p className="mt-2">
          TCS and MSTC service charge are calculated for disclosure. They are not added into buyer cash receivable in the
          source sheet. GST TDS is a per-lot rate (0% or 2% in the sample). Where the sheet notes “GST TDS not deducted”,
          the buyer paid the GST TDS amount as well — recorded as a higher final-payment receipt.
        </p>
      </article>
    </div>
  );
}

function Rate(props: { name: string; label: string; defaultValue: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{props.label}</span>
      <input
        name={props.name}
        type="number"
        step="0.0001"
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        className="mt-1 h-10 w-full rounded-sm border px-3 text-sm disabled:bg-stone-50"
      />
    </label>
  );
}
