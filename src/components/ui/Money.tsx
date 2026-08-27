import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Money({
  value,
  className,
  paise,
  tone,
}: {
  value: number | null | undefined;
  className?: string;
  paise?: boolean;
  tone?: "default" | "short" | "excess" | "muted" | "strong";
}) {
  const t =
    tone === "short"
      ? "text-rose-700"
      : tone === "excess"
        ? "text-sky-800"
        : tone === "muted"
          ? "text-stone-500"
          : tone === "strong"
            ? "text-stone-900"
            : "text-stone-800";
  return <span className={cn("tabular font-mono text-[13px] tracking-tight", t, className)}>{formatINR(value, { paise })}</span>;
}

export function DiffMoney({ value }: { value: number }) {
  if (Math.abs(value) <= 1) {
    return <Money value={0} tone="muted" />;
  }
  if (value > 0) {
    return (
      <span className="tabular font-mono text-[13px] text-rose-700">
        Short {formatINR(value)}
      </span>
    );
  }
  return (
    <span className="tabular font-mono text-[13px] text-sky-800">
      Excess {formatINR(Math.abs(value))}
    </span>
  );
}
