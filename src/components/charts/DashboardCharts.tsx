"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINRCompact } from "@/lib/format";

const COLORS = {
  received: "#0f766e",
  outstanding: "#b45309",
  pending: "#d97706",
  short: "#e11d48",
  excess: "#0369a1",
  paid: "#047857",
};

export function AuctionBars({
  data,
}: {
  data: { number: string; receivable: number; received: number; outstanding: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4}>
          <CartesianGrid stroke="#e7e5e4" vertical={false} />
          <XAxis dataKey="number" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={(v: number) => formatINRCompact(v)} />
          <Legend />
          <Bar dataKey="received" name="Received" fill={COLORS.received} radius={[2, 2, 0, 0]} />
          <Bar dataKey="outstanding" name="Outstanding" fill={COLORS.outstanding} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BuyerBars({ data }: { data: { name: string; outstanding: number }[] }) {
  const rows = data.slice(0, 8).map((d) => ({
    ...d,
    short: d.name.length > 18 ? d.name.slice(0, 16) + "…" : d.name,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 16 }}>
          <CartesianGrid stroke="#e7e5e4" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="short" width={120} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatINRCompact(v)} />
          <Bar dataKey="outstanding" name="Outstanding" fill={COLORS.outstanding} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPie({
  data,
}: {
  data: { RECEIVED: number; SHORT: number; PENDING: number; EXCESS: number };
}) {
  const rows = [
    { name: "Settled", value: data.RECEIVED, color: COLORS.paid },
    { name: "Short / partial", value: data.SHORT, color: COLORS.short },
    { name: "Pending", value: data.PENDING, color: COLORS.pending },
    { name: "Excess", value: data.EXCESS, color: COLORS.excess },
  ].filter((r) => r.value > 0);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CollectionBars({ data }: { data: { date: string; amount: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#e7e5e4" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 11 }} width={72} />
          <Tooltip formatter={(v: number) => formatINRCompact(v)} />
          <Bar dataKey="amount" name="Collections" fill="#1c1917" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
