"use client";

import Link from "next/link";
import { DataTable, type Column } from "./DataTable";
import { Money, DiffMoney } from "../ui/Money";
import { StatusBadge } from "../ui/StatusBadge";
import { paymentStatusLabel, type PaymentStatus } from "@/lib/calc";
import { formatDate } from "@/lib/format";

export type DepositRow = {
  id: string;
  lotNumber: string;
  buyer: string;
  auction: string;
  expected: number;
  received: number;
  diff: number;
  status: PaymentStatus;
  date: string | null;
};

export function DepositsTable({ rows }: { rows: DepositRow[] }) {
  const columns: Column<DepositRow>[] = [
    {
      key: "lot",
      header: "Lot",
      sortValue: (r) => Number(r.lotNumber),
      cell: (r) => (
        <Link href={`/lots/${r.id}`} className="font-semibold text-copper-800 hover:underline">
          {r.lotNumber}
        </Link>
      ),
    },
    { key: "auction", header: "Auction", sortValue: (r) => r.auction, cell: (r) => r.auction },
    { key: "buyer", header: "Buyer", sortValue: (r) => r.buyer, cell: (r) => r.buyer },
    { key: "exp", header: "Expected", align: "right", sortValue: (r) => r.expected, cell: (r) => <Money value={r.expected} /> },
    { key: "rec", header: "Received", align: "right", sortValue: (r) => r.received, cell: (r) => <Money value={r.received} /> },
    { key: "diff", header: "Difference", align: "right", sortValue: (r) => r.diff, cell: (r) => <DiffMoney value={r.diff} /> },
    {
      key: "st",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} label={paymentStatusLabel(r.status, "sd")} />,
    },
    { key: "date", header: "Receipt date", sortValue: (r) => r.date || "", cell: (r) => formatDate(r.date) },
  ];
  return (
    <DataTable rows={rows} columns={columns} exportName="security-deposits" searchText={(r) => `${r.lotNumber} ${r.buyer} ${r.auction}`} />
  );
}

export type FpRow = DepositRow & { remark?: string | null };

export function FinalPaymentsTable({ rows }: { rows: FpRow[] }) {
  const columns: Column<FpRow>[] = [
    {
      key: "lot",
      header: "Lot",
      sortValue: (r) => Number(r.lotNumber),
      cell: (r) => (
        <Link href={`/lots/${r.id}`} className="font-semibold text-copper-800 hover:underline">
          {r.lotNumber}
        </Link>
      ),
    },
    { key: "auction", header: "Auction", sortValue: (r) => r.auction, cell: (r) => r.auction },
    { key: "buyer", header: "Buyer", sortValue: (r) => r.buyer, cell: (r) => r.buyer },
    { key: "exp", header: "Expected", align: "right", sortValue: (r) => r.expected, cell: (r) => <Money value={r.expected} /> },
    { key: "rec", header: "Received", align: "right", sortValue: (r) => r.received, cell: (r) => <Money value={r.received} paise /> },
    { key: "diff", header: "Short / (excess)", align: "right", sortValue: (r) => r.diff, cell: (r) => <DiffMoney value={r.diff} /> },
    {
      key: "st",
      header: "Status",
      sortValue: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} label={paymentStatusLabel(r.status, "fp")} />,
    },
    { key: "date", header: "Receipt date", sortValue: (r) => r.date || "", cell: (r) => formatDate(r.date) },
  ];
  return (
    <DataTable rows={rows} columns={columns} exportName="final-payments" searchText={(r) => `${r.lotNumber} ${r.buyer} ${r.auction}`} />
  );
}

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  lotId: string;
  lotNumber: string;
  auction: string;
  buyer: string;
  date: string | null;
  amount: number | null;
  status: string;
};

export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const columns: Column<InvoiceRow>[] = [
    { key: "inv", header: "Invoice", sortValue: (r) => r.invoiceNumber, cell: (r) => <span className="font-semibold">{r.invoiceNumber}</span> },
    {
      key: "lot",
      header: "Lot",
      sortValue: (r) => r.lotNumber,
      cell: (r) => (
        <Link href={`/lots/${r.lotId}`} className="text-copper-800 hover:underline">
          {r.lotNumber}
        </Link>
      ),
    },
    { key: "auction", header: "Auction", sortValue: (r) => r.auction, cell: (r) => r.auction },
    { key: "buyer", header: "Buyer", sortValue: (r) => r.buyer, cell: (r) => r.buyer },
    { key: "date", header: "Date", sortValue: (r) => r.date || "", cell: (r) => formatDate(r.date) },
    { key: "amt", header: "Amount", align: "right", sortValue: (r) => r.amount || 0, cell: (r) => <Money value={r.amount} /> },
    { key: "st", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      exportName="invoices"
      searchText={(r) => `${r.invoiceNumber} ${r.lotNumber} ${r.buyer}`}
      emptyTitle="No invoices"
    />
  );
}

export type SapRow = {
  id: string;
  documentNumber: string;
  type: string | null;
  lotId: string;
  lotNumber: string;
  auction: string;
  buyer: string;
  invoice: string;
  date: string | null;
  amount: number | null;
  status: string;
};

export function SapTable({ rows }: { rows: SapRow[] }) {
  const columns: Column<SapRow>[] = [
    { key: "doc", header: "SAP document", sortValue: (r) => r.documentNumber, cell: (r) => <span className="font-semibold">{r.documentNumber}</span> },
    { key: "type", header: "Type", sortValue: (r) => r.type || "", cell: (r) => r.type || "—" },
    {
      key: "lot",
      header: "Lot",
      sortValue: (r) => r.lotNumber,
      cell: (r) => (
        <Link href={`/lots/${r.lotId}`} className="text-copper-800 hover:underline">
          {r.lotNumber}
        </Link>
      ),
    },
    { key: "buyer", header: "Buyer", sortValue: (r) => r.buyer, cell: (r) => r.buyer },
    { key: "inv", header: "Invoice", sortValue: (r) => r.invoice, cell: (r) => r.invoice },
    { key: "date", header: "Doc date", sortValue: (r) => r.date || "", cell: (r) => formatDate(r.date) },
    { key: "amt", header: "Amount", align: "right", sortValue: (r) => r.amount || 0, cell: (r) => <Money value={r.amount} /> },
    { key: "st", header: "Posting", sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <DataTable rows={rows} columns={columns} exportName="sap-documents" searchText={(r) => `${r.documentNumber} ${r.lotNumber} ${r.buyer} ${r.invoice}`} />
  );
}
