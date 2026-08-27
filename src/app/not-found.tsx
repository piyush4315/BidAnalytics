import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 px-6 text-center">
      <p className="font-display text-4xl text-stone-900">Not found</p>
      <p className="mt-2 max-w-md text-sm text-stone-600">That auction, lot or page is not in the ledger.</p>
      <Link href="/" className="mt-6 rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white">
        Back to dashboard
      </Link>
    </div>
  );
}
