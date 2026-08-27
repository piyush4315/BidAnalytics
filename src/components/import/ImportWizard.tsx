"use client";

import { useState } from "react";
import { IMPORT_FIELDS, fieldLabel, type ImportField } from "@/lib/import-map";

type Preview = {
  filename: string;
  sheets: string[];
  sheet: string;
  headers: string[];
  mapping: Record<string, ImportField | "">;
  preview: Record<string, unknown>[];
  rowCount: number;
};

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, ImportField | "">>({});
  const [errors, setErrors] = useState<{ row: number; message: string }[] | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);

  async function load(sheet?: string) {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("intent", "preview");
    if (sheet) fd.set("sheet", sheet);
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setResult(data.error);
      return;
    }
    setPreview(data);
    setMapping(data.mapping);
    setStep(3);
  }

  async function commit() {
    if (!file || !preview) return;
    setBusy(true);
    setErrors(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("intent", "commit");
    fd.set("sheet", preview.sheet);
    fd.set("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/import", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setResult(data.error);
      return;
    }
    setErrors(data.errors || []);
    setResult(`Imported ${data.created} lot(s). ${data.errors?.length || 0} row(s) skipped.`);
    setStep(7);
  }

  return (
    <div className="rounded-sm border border-stone-200 bg-white p-4 shadow-card">
      <ol className="mb-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {["Upload", "Sheet", "Map columns", "Validate", "Preview", "Errors", "Confirm"].map((l, i) => (
          <li key={l} className={step >= i + 1 ? "text-copper-700" : ""}>
            {i + 1}. {l}
          </li>
        ))}
      </ol>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">1. Upload</p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setPreview(null);
              setResult(null);
              setStep(1);
            }}
            className="mt-1 text-sm"
          />
          {file ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => load()}
              className="ml-3 rounded-sm bg-ink-900 px-3 py-1.5 text-sm font-semibold text-white"
            >
              Read workbook
            </button>
          ) : null}
        </div>

        {preview ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">2. Sheet</p>
              <select
                value={preview.sheet}
                onChange={(e) => load(e.target.value)}
                className="mt-1 h-10 rounded-sm border px-2 text-sm"
              >
                {preview.sheets.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-stone-500">{preview.rowCount} data rows</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">3. Column mapping</p>
              <div className="mt-2 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-stone-500">
                      <th className="py-1 pr-4">Excel column</th>
                      <th>Application field</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.headers.map((h) => (
                      <tr key={h} className="border-t border-stone-100">
                        <td className="py-1 pr-4 font-medium">{h}</td>
                        <td>
                          <select
                            value={mapping[h] || ""}
                            onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as ImportField | "" }))}
                            className="h-8 rounded-sm border px-2 text-sm"
                          >
                            <option value="">Ignore</option>
                            {IMPORT_FIELDS.map((f) => (
                              <option key={f} value={f}>
                                {fieldLabel(f)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">5. Preview (first 8 rows)</p>
              <div className="mt-2 max-h-56 overflow-auto text-xs">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h} className="whitespace-nowrap px-2 py-1 text-left text-stone-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        {preview.headers.map((h) => (
                          <td key={h} className="whitespace-nowrap px-2 py-1">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={commit}
              className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Importing…" : "7. Confirm import"}
            </button>
          </>
        ) : null}

        {result ? <p className="text-sm text-stone-800">{result}</p> : null}
        {errors && errors.length ? (
          <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            <p className="font-semibold">6. Error report</p>
            <ul className="mt-1 list-disc pl-4">
              {errors.slice(0, 40).map((e, i) => (
                <li key={i}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
