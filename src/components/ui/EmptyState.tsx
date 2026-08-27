export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-3 h-10 w-10 rounded-sm border border-stone-200 bg-paper-50" />
      <h3 className="font-display text-lg text-stone-900">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-stone-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{message}</div>
  );
}
