"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center rounded-sm bg-ink-900 px-3 py-1.5 text-[13px] font-semibold text-paper-50 no-print"
    >
      Print / PDF
    </button>
  );
}
