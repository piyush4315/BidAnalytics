import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidLedger — Scrap auction operations",
  description: "Auction lots, bid sheets, receivables, deposits, invoices and SAP tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
