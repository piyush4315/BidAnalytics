import { calculationLines, type LotCalculation } from "@/lib/calc";
import { formatINR, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CalcBreakdown({ calc }: { calc: LotCalculation }) {
  const lines = calculationLines(calc);
  const groups = [
    { id: "tax", title: "Material & statutory tax" },
    { id: "service", title: "MSTC service charge (not buyer cash)" },
    { id: "cash", title: "Cash receivable from buyer" },
    { id: "settlement", title: "Deposit & final payment split" },
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((g) => (
        <section key={g.id} className="rounded-sm border border-stone-200 bg-white">
          <header className="border-b border-stone-100 px-4 py-2.5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-500">{g.title}</h3>
          </header>
          <ul className="divide-y divide-stone-100">
            {lines
              .filter((l) => l.group === g.id)
              .map((l) => (
                <li key={l.key} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className={cn("text-sm", l.sign === "eq" ? "font-semibold text-stone-900" : "text-stone-700")}>
                      {l.sign === "plus" ? "+ " : l.sign === "minus" ? "− " : l.sign === "eq" ? "= " : ""}
                      {l.label}
                    </p>
                    {l.detail ? <p className="mt-0.5 font-mono text-[11px] text-stone-400">{l.detail}</p> : null}
                  </div>
                  <p
                    className={cn(
                      "tabular font-mono text-[13px] whitespace-nowrap",
                      l.sign === "eq" ? "font-semibold text-stone-900" : "text-stone-700",
                    )}
                  >
                    {formatINR(l.amount, { paise: Math.abs(l.amount % 1) > 0.001 })}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <p className="lg:col-span-2 text-xs text-stone-500">
        Rates used for this lot: GST {formatPct(calc.rates.gstRate)} · TCS {formatPct(calc.rates.tcsRate)} ·
        TDS 194(O) {formatPct(calc.rates.tds194ORate, 2)} · Service charge {formatPct(calc.rates.serviceChargeRate, 2)} ·
        Cash factor {formatPct(calc.rates.cashReceivableFactor, 2)} · Security deposit{" "}
        {formatPct(calc.rates.securityDepositRate, 0)} · GST TDS on this lot {formatPct(calc.gstTdsRate, 2)}. Changing
        global rates does not rewrite this snapshot unless an authorised user recalculates.
      </p>
    </div>
  );
}
