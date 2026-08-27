"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Hit = { type: string; id: string; title: string; subtitle: string; href: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 1) {
        setHits([]);
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setHits(data.hits || []);
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-sm border border-stone-200 bg-white px-3 text-left text-sm text-stone-500 shadow-sm hover:border-stone-300"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">Search lots, buyers, invoices, SAP…</span>
        <kbd className="hidden rounded-sm border border-stone-200 bg-paper-50 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 sm:inline">
          ⌘K
        </kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/40 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl overflow-hidden rounded-sm border border-stone-200 bg-white shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-stone-100 px-3">
              <Search className="h-4 w-4 text-stone-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Auction, lot, buyer, invoice, SAP document…"
                className="h-12 flex-1 text-sm outline-none"
              />
            </div>
            <div className="max-h-80 overflow-auto">
              {loading ? <p className="px-4 py-6 text-sm text-stone-500">Searching…</p> : null}
              {!loading && q && hits.length === 0 ? (
                <p className="px-4 py-6 text-sm text-stone-500">No matches for “{q}”.</p>
              ) : null}
              {hits.map((h) => (
                <button
                  key={`${h.type}-${h.id}`}
                  type="button"
                  className="flex w-full items-start gap-3 border-b border-stone-50 px-4 py-2.5 text-left hover:bg-paper-50"
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                    router.push(h.href);
                  }}
                >
                  <span className="mt-0.5 rounded-sm bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                    {h.type}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-stone-900">{h.title}</span>
                    <span className="block text-xs text-stone-500">{h.subtitle}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
