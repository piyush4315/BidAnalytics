import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ hits: [] }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 1) return NextResponse.json({ hits: [] });

  const [lots, buyers, auctions, invoices, sap] = await Promise.all([
    prisma.lot.findMany({
      where: {
        deletedAt: null,
        OR: [
          { lotNumber: { contains: q } },
          { name: { contains: q } },
        ],
      },
      take: 8,
      include: { buyer: true, auction: true },
    }),
    prisma.buyer.findMany({ where: { deletedAt: null, name: { contains: q } }, take: 6 }),
    prisma.auction.findMany({ where: { deletedAt: null, number: { contains: q } }, take: 6 }),
    prisma.invoice.findMany({
      where: { deletedAt: null, invoiceNumber: { contains: q } },
      take: 6,
      include: { lot: true },
    }),
    prisma.sapDocument.findMany({
      where: { deletedAt: null, documentNumber: { contains: q } },
      take: 6,
      include: { lot: true },
    }),
  ]);

  const hits = [
    ...auctions.map((a) => ({
      type: "Auction",
      id: a.id,
      title: a.number,
      subtitle: a.title || "Auction",
      href: `/auctions/${a.id}`,
    })),
    ...lots.map((l) => ({
      type: "Lot",
      id: l.id,
      title: `Lot ${l.lotNumber}`,
      subtitle: `${l.auction.number} · ${l.buyer?.name || "Unassigned"} · ${l.name}`,
      href: `/lots/${l.id}`,
    })),
    ...buyers.map((b) => ({
      type: "Buyer",
      id: b.id,
      title: b.name,
      subtitle: b.gstNumber || "Buyer master",
      href: `/buyers/${b.id}`,
    })),
    ...invoices.map((i) => ({
      type: "Invoice",
      id: i.id,
      title: i.invoiceNumber,
      subtitle: `Lot ${i.lot.lotNumber}`,
      href: `/lots/${i.lotId}`,
    })),
    ...sap.map((s) => ({
      type: "SAP",
      id: s.id,
      title: s.documentNumber,
      subtitle: `Lot ${s.lot.lotNumber}`,
      href: `/lots/${s.lotId}`,
    })),
  ];
  return NextResponse.json({ hits });
}
