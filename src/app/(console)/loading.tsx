export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-sm bg-stone-200/80" />
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="h-24 rounded-sm bg-white" />
        <div className="h-24 rounded-sm bg-white" />
        <div className="h-24 rounded-sm bg-white" />
        <div className="h-24 rounded-sm bg-white" />
      </div>
      <div className="h-64 rounded-sm bg-white" />
    </div>
  );
}
