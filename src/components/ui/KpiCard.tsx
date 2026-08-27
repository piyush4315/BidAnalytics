import { cn } from "@/lib/cn";
import { Money } from "./Money";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  money,
}: {
  label: string;
  value?: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
  money?: number;
}) {
  const bar = {
    neutral: "bg-stone-400",
    good: "bg-emerald-600",
    warn: "bg-amber-500",
    bad: "bg-rose-600",
    info: "bg-sky-600",
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-sm border border-stone-200 bg-white p-4 shadow-card">
      <span className={cn("absolute inset-y-0 left-0 w-[3px]", bar)} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">{label}</p>
      <div className="mt-1.5 text-[22px] font-semibold leading-none tracking-tight text-stone-900">
        {money !== undefined ? <Money value={money} className="text-[22px] font-semibold" /> : value}
      </div>
      {hint ? <p className="mt-2 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
