import { cn } from "@/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper-700">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-[28px] leading-tight text-stone-900">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  href,
  variant = "primary",
  type = "button",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-ink-900 text-paper-50 hover:bg-ink-800",
    secondary: "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-paper-50",
    ghost: "text-stone-700 hover:bg-stone-200/60",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
  }[variant];
  const cls = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-[13px] font-semibold transition",
    styles,
    className,
  );
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
