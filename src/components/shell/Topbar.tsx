"use client";

import { useState } from "react";
import { Bell, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { GlobalSearch } from "../search/GlobalSearch";
import { roleLabel } from "@/lib/permissions";
import type { Alert } from "@/lib/alerts";
import { Sidebar } from "./Sidebar";

export function Topbar({
  user,
  alerts,
}: {
  user: { name: string; email: string; role: string };
  alerts: Alert[];
}) {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const router = useRouter();
  const danger = alerts.filter((a) => a.severity === "danger").length;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-paper-50/90 px-3 backdrop-blur no-print">
        <button
          className="rounded-sm p-1.5 text-stone-700 lg:hidden"
          onClick={() => setMenu(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <GlobalSearch />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setBell((v) => !v)}
            className="relative rounded-sm p-1.5 text-stone-700 hover:bg-white"
            aria-label="Alerts"
          >
            <Bell className="h-5 w-5" />
            {danger > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-600" />
            ) : null}
          </button>
          {bell ? (
            <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-sm border border-stone-200 bg-white shadow-card">
              <div className="border-b border-stone-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Actionable alerts · {alerts.length}
              </div>
              <div className="max-h-80 overflow-auto">
                {alerts.slice(0, 12).map((a) => (
                  <a
                    key={a.id}
                    href={a.href}
                    className="block border-b border-stone-50 px-3 py-2 hover:bg-paper-50"
                    onClick={() => setBell(false)}
                  >
                    <p className="text-sm font-medium text-stone-900">{a.title}</p>
                    <p className="text-xs text-stone-500">{a.message}</p>
                  </a>
                ))}
                {alerts.length === 0 ? <p className="px-3 py-6 text-sm text-stone-500">No open alerts.</p> : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-right">
            <p className="text-[13px] font-semibold leading-none text-stone-800">{user.name}</p>
            <p className="mt-0.5 text-[11px] text-stone-500">{roleLabel(user.role)}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-sm p-1.5 text-stone-600 hover:bg-white"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      {menu ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <Sidebar role={user.role} onNavigate={() => setMenu(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
