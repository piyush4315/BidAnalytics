"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("admin@bidledger.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Sign-in failed.");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink-950 px-10 py-10 text-paper-50 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(800px 400px at 20% 20%, rgba(184,115,51,0.35), transparent), radial-gradient(600px 300px at 80% 80%, rgba(15,118,110,0.25), transparent)",
          }}
        />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.22em] text-copper-300">MSTC bid operations</p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05]">BidLedger</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-400">
            Combined bid sheets, lot financials, security deposits, final payments, invoices and SAP documents — in one
            auditable ledger.
          </p>
        </div>
        <dl className="relative grid grid-cols-2 gap-6 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-stone-500">Cash factor</dt>
            <dd className="mt-1 font-mono text-lg text-copper-200">117.65%</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-stone-500">Security deposit</dt>
            <dd className="mt-1 font-mono text-lg text-copper-200">25% of MV</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-stone-500">GST</dt>
            <dd className="mt-1 font-mono text-lg">18%</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-stone-500">Service charge</dt>
            <dd className="mt-1 font-mono text-lg">2.25% × 118%</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-1 items-center justify-center bg-paper-50 px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <p className="font-display text-3xl text-stone-900 lg:hidden">BidLedger</p>
          <h2 className="font-display text-2xl text-stone-900">Sign in</h2>
          <p className="mt-1 text-sm text-stone-600">Internal operations console. Use a provisioned account.</p>
          <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-stone-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-10 w-full rounded-sm border border-stone-300 bg-white px-3 text-sm outline-none focus:border-copper-500"
            required
          />
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-stone-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-10 w-full rounded-sm border border-stone-300 bg-white px-3 text-sm outline-none focus:border-copper-500"
            required
          />
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 h-10 w-full rounded-sm bg-ink-900 text-sm font-semibold text-paper-50 hover:bg-ink-800 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
          <div className="mt-8 rounded-sm border border-stone-200 bg-white p-3 text-[12px] text-stone-600">
            <p className="font-semibold uppercase tracking-wide text-stone-500">Demo accounts</p>
            <ul className="mt-2 space-y-1 font-mono">
              <li>admin@bidledger.local · Admin@123</li>
              <li>manager@bidledger.local · Manager@123</li>
              <li>entry@bidledger.local · Entry@123</li>
              <li>viewer@bidledger.local · Viewer@123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
