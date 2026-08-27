"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-2xl text-stone-900">Something went wrong</p>
      <p className="mt-2 max-w-md text-sm text-stone-600">{error.message || "The request could not be completed."}</p>
      <button onClick={reset} className="mt-6 rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white">
        Try again
      </button>
    </div>
  );
}
