"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "../ui/EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  align?: "left" | "right";
  className?: string;
  defaultHidden?: boolean;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchPlaceholder = "Search this table…",
  searchText,
  pageSize = 25,
  exportName,
  emptyTitle = "No records",
  emptyDescription,
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchText?: (row: T) => string;
  pageSize?: number;
  exportName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.key, true])),
  );
  const [colsOpen, setColsOpen] = useState(false);

  const visibleCols = columns.filter((c) => !hidden[c.key]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = rows;
    if (query) {
      list = rows.filter((row) => {
        if (searchText) return searchText(row).toLowerCase().includes(query);
        return JSON.stringify(row).toLowerCase().includes(query);
      });
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const getter = col?.sortValue;
      if (getter) {
        list = [...list].sort((a, b) => {
          const va = getter(a);
          const vb = getter(b);
          const na = va instanceof Date ? va.getTime() : va ?? "";
          const nb = vb instanceof Date ? vb.getTime() : vb ?? "";
          if (typeof na === "number" && typeof nb === "number") {
            return sortDir === "asc" ? na - nb : nb - na;
          }
          const sa = String(na);
          const sb = String(nb);
          return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
        });
      }
    }
    return list;
  }, [rows, q, sortKey, sortDir, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const headers = visibleCols.map((c) => c.header);
    const lines = [headers.join(",")];
    for (const row of filtered) {
      const cells = visibleCols.map((c) => {
        const raw = c.sortValue ? c.sortValue(row) : "";
        const text = raw instanceof Date ? raw.toISOString() : String(raw ?? "");
        return `"${text.replaceAll('"', '""')}"`;
      });
      lines.push(cells.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-sm border border-stone-200 bg-white shadow-card">
      <div className="flex flex-col gap-2 border-b border-stone-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-sm border border-stone-200 bg-paper-50 px-3 text-sm outline-none focus:border-copper-400 sm:max-w-sm"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-500">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColsOpen((v) => !v)}
              className="rounded-sm px-2 py-1 font-semibold text-stone-600 hover:bg-stone-100"
            >
              Columns
            </button>
            {colsOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-sm border border-stone-200 bg-white p-2 shadow-card">
                {columns.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 px-1 py-1 text-stone-700">
                    <input
                      type="checkbox"
                      checked={!hidden[c.key]}
                      onChange={() => setHidden((h) => ({ ...h, [c.key]: !h[c.key] }))}
                    />
                    {c.header}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-sm px-2 py-1 font-semibold text-stone-600 hover:bg-stone-100"
          >
            Export CSV
          </button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription || "Try a different search or filter."} />
        </div>
      ) : (
        <div className="overflow-auto ledger-scroll">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-paper-50">
              <tr className="ledger-table border-b border-stone-200">
                {visibleCols.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-left",
                      c.align === "right" && "text-right",
                      c.sortValue && "cursor-pointer select-none hover:text-stone-800",
                    )}
                    onClick={() => c.sortValue && toggleSort(c.key)}
                  >
                    {c.header}
                    {sortKey === c.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <tr key={row.id} className="border-b border-stone-100 hover:bg-paper-50/80">
                  {visibleCols.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-2 align-middle",
                        c.align === "right" && "text-right",
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between border-t border-stone-100 px-3 py-2 text-xs text-stone-600">
          <span>
            Page {safePage + 1} of {pages}
          </span>
          <div className="flex gap-1">
            <button
              className="rounded-sm px-2 py-1 hover:bg-stone-100 disabled:opacity-40"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <button
              className="rounded-sm px-2 py-1 hover:bg-stone-100 disabled:opacity-40"
              disabled={safePage >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
