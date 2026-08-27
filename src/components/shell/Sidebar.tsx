"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  Boxes,
  Users,
  Wallet,
  Shield,
  Banknote,
  FileText,
  Database,
  BarChart3,
  Upload,
  ScrollText,
  Settings,
  LockKeyhole,
} from "lucide-react";
import { NAV, NAV_FOOTER, APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/cn";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Gavel,
  Boxes,
  Users,
  Wallet,
  Shield,
  Banknote,
  FileText,
  Database,
  BarChart3,
  Upload,
  ScrollText,
  Settings,
  LockKeyhole,
};

function Item({ href, label, icon, onClick }: { href: string; label: string; icon: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const Icon = ICONS[icon] || LayoutDashboard;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition",
        active
          ? "bg-white/10 text-copper-200"
          : "text-stone-400 hover:bg-white/5 hover:text-stone-100",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-ink-950 text-stone-200">
      <div className="border-b border-white/10 px-4 py-4">
        <Link href="/" onClick={onNavigate} className="block">
          <p className="font-display text-[22px] leading-none text-paper-50">{APP_NAME}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-copper-300">Auction ledger</p>
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">Operations</p>
        {NAV.map((n) => (
          <Item key={n.href} {...n} onClick={onNavigate} />
        ))}
      </nav>
      <div className="space-y-0.5 border-t border-white/10 px-2 py-3">
        {NAV_FOOTER.filter((n) => !("admin" in n && n.admin) || role === "ADMIN").map((n) => (
          <Item key={n.href} href={n.href} label={n.label} icon={n.icon} onClick={onNavigate} />
        ))}
      </div>
    </div>
  );
}
