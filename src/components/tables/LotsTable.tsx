"use client";

import Link from "next/link";
import { DataTable, type Column } from "./DataTable";
import { Money, DiffMoney } from "../ui/Money";
import { StatusBadge } from "../ui/StatusBadge";
import { formatDate, formatQty } from "@/lib/format";
import { paymentStatusLabel, type PaymentStatus } from "@/lib/calc";

export type LotRow = {
  id: string;
  lotNumber: string;
  name: string;
  auctionNumber: string;
  buyerName: string;
  quantity: number;
  unit: string;
  status: string;
  rate: number;
  materialValue: number;
  gstAmount: number;
  tcsAmount: number;
  gstTdsAmount: number;
  serviceChargeToMstc: number;
  totalReceivable: number;
  sdExpected: number;
  sdReceived: number;
  fpExpected: number;
  fpReceived: number;
  received: number;
  outstanding: number;
  sdStatus: PaymentStatus;
  fpStatus: PaymentStatus;
  settleStatus: PaymentStatus;
  invoiceNumber: string | null;
  sapNumber: string | null;
  lastSdDate: string | null;
  lastFpDate: string | null;
};

export function LotsTable({ rows }: { rows: LotRow[] }) {
  const columns: Column<LotRow>[] = [
    {
      key: "lotNumber",
      header: "Lot",
      sortValue: (r) => Number(r.lotNumber) || r.lotNumber,
      cell: (r) => (
        <Link href={`/lots/${r.id}`} className="font-semibold text-copper-800 hover:underline">
          {r.lotNumber}
        </Link>
      ),
    },
    { key: "auction", header: "Auction", sortValue: (r) => r.auctionNumber, cell: (r) => r.auctionNumber },
    {
      key: "buyer",
      header: "Buyer",
      sortValue: (r) => r.buyerName,
      cell: (r) => <span className="block max-w-[220px] truncate">{r.buyerName}</span>,
    },
    {
      key: "name",
      header: "Material",
      sortValue: (r) => r.name,
      cell: (r) => (
        <span className="block max-w-[280px] truncate text-stone-700" title={r.name}>
          {r.name}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      sortValue: (r) => r.quantity,
      cell: (r) => <span className="tabular">{formatQty(r.quantity, r.unit)}</span>,
    },
    { key: "rate", header: "Rate", align: "right", sortValue: (r) => r.rate, cell: (r) => <Money value={r.rate} /> },
    {
      key: "mv",
      header: "Material value",
      align: "right",
      sortValue: (r) => r.materialValue,
      cell: (r) => <Money value={r.materialValue} />,
    },
    {
      key: "gst",
      header: "GST",
      align: "right",
      defaultHidden: true,
      sortValue: (r) => r.gstAmount,
      cell: (r) => <Money value={r.gstAmount} />,
    },
    {
      key: "tcs",
      header: "TCS",
      align: "right",
      defaultHidden: true,
      sortValue: (r) => r.tcsAmount,
      cell: (r) => <Money value={r.tcsAmount} />,
    },
    {
      key: "gsttds",
      header: "GST TDS",
      align: "right",
      defaultHidden: true,
      sortValue: (r) => r.gstTdsAmount,
      cell: (r) => <Money value={r.gstTdsAmount} />,
    },
    {
      key: "sc",
      header: "SC to MSTC",
      align: "right",
      defaultHidden: true,
      sortValue: (r) => r.serviceChargeToMstc,
      cell: (r) => <Money value={r.serviceChargeToMstc} />,
    },
    {
      key: "recv",
      header: "Receivable",
      align: "right",
      sortValue: (r) => r.totalReceivable,
      cell: (r) => <Money value={r.totalReceivable} tone="strong" />,
    },
    {
      key: "received",
      header: "Received",
      align: "right",
      sortValue: (r) => r.received,
      cell: (r) => <Money value={r.received} />,
    },
    {
      key: "out",
      header: "Outstanding",
      align: "right",
      sortValue: (r) => r.outstanding,
      cell: (r) => <DiffMoney value={r.outstanding} />,
    },
    {
      key: "sd",
      header: "SD",
      sortValue: (r) => r.sdStatus,
      cell: (r) => <StatusBadge status={r.sdStatus} label={paymentStatusLabel(r.sdStatus, "sd")} />,
    },
    {
      key: "fp",
      header: "Final payment",
      sortValue: (r) => r.fpStatus,
      cell: (r) => <StatusBadge status={r.fpStatus} label={paymentStatusLabel(r.fpStatus, "fp")} />,
    },
    {
      key: "inv",
      header: "Invoice",
      sortValue: (r) => r.invoiceNumber || "",
      cell: (r) => r.invoiceNumber || <span className="text-stone-400">—</span>,
    },
    {
      key: "sap",
      header: "SAP",
      sortValue: (r) => r.sapNumber || "",
      cell: (r) => r.sapNumber || <span className="text-stone-400">—</span>,
    },
    {
      key: "sddate",
      header: "SD date",
      defaultHidden: true,
      sortValue: (r) => r.lastSdDate || "",
      cell: (r) => formatDate(r.lastSdDate),
    },
    {
      key: "fpdate",
      header: "FP date",
      defaultHidden: true,
      sortValue: (r) => r.lastFpDate || "",
      cell: (r) => formatDate(r.lastFpDate),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      exportName="lots"
      searchPlaceholder="Search lot, buyer, material, invoice, SAP…"
      searchText={(r) =>
        [r.lotNumber, r.auctionNumber, r.buyerName, r.name, r.invoiceNumber, r.sapNumber, r.status].join(" ")
      }
      emptyTitle="No lots match"
    />
  );
}
