import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  red: "bg-rose-50 text-rose-800 ring-rose-200",
  slate: "bg-stone-100 text-stone-700 ring-stone-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  copper: "bg-copper-100 text-copper-800 ring-copper-200",
};

export function statusTone(status: string): keyof typeof TONES {
  const s = status.toUpperCase();
  if (["RECEIVED", "FULLY PAID", "SOLD", "CLOSED", "POSTED", "GENERATED", "ACTIVE", "OPEN", "SETTLED"].includes(s))
    return "green";
  if (["PARTIAL", "PARTIALLY PAID", "PARTIALLY RECEIVED", "PENDING", "DRAFT", "NOT_GENERATED"].includes(s))
    return "amber";
  if (["SHORT", "SHORT PAID", "CANCELLED", "DANGER", "INACTIVE"].includes(s)) return "red";
  if (["EXCESS", "EXCESS PAID", "EXCESS RECEIVED"].includes(s)) return "blue";
  return "slate";
}

export function StatusBadge({
  status,
  label,
  tone,
}: {
  status: string;
  label?: string;
  tone?: keyof typeof TONES;
}) {
  const t = tone || statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset whitespace-nowrap",
        TONES[t],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label || status.replaceAll("_", " ")}
    </span>
  );
}
