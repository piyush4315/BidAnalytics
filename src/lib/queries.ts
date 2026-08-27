import { prisma } from "./prisma";
import { rollupLot } from "./lot-finance";
import { ratesFromConfig, type TaxRates, DEFAULT_RATES } from "./calc";

export async function getTaxRates(): Promise<TaxRates> {
  const cfg = await prisma.taxConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!cfg) return DEFAULT_RATES;
  return ratesFromConfig(cfg);
}

const lotInclude = {
  auction: true,
  buyer: true,
  payments: { where: { deletedAt: null } },
  invoices: { where: { deletedAt: null }, orderBy: { createdAt: "desc" as const } },
  sapDocuments: { where: { deletedAt: null }, orderBy: { createdAt: "desc" as const } },
};

export async function getLots() {
  const lots = await prisma.lot.findMany({
    where: { deletedAt: null },
    include: lotInclude,
    orderBy: { lotNumber: "asc" },
  });
  return lots.map((lot) => ({ ...lot, rollup: rollupLot(lot) })) as Array<(typeof lots)[number] & { rollup: ReturnType<typeof rollupLot> }>;
}

export async function getLot(id: string) {
  const lot = await prisma.lot.findFirst({
    where: { id, deletedAt: null },
    include: {
      ...lotInclude,
      payments: { where: { deletedAt: null }, include: { createdBy: true }, orderBy: { receivedOn: "asc" } },
    },
  });
  if (!lot) return null;
  return { ...lot, rollup: rollupLot(lot) } as typeof lot & { rollup: ReturnType<typeof rollupLot> };
}

export async function getDashboard() {
  const lots = await getLots();
  const auctions = await prisma.auction.findMany({ where: { deletedAt: null } });
  const buyers = await prisma.buyer.findMany({ where: { deletedAt: null } });

  const materialValue = lots.reduce((s, l) => s + l.materialValue, 0);
  const receivable = lots.reduce((s, l) => s + l.totalReceivable, 0);
  const received = lots.reduce((s, l) => s + l.rollup.totalReceived, 0);
  const outstanding = receivable - received;
  const sdPending = lots.filter((l) => l.rollup.sdStatus === "PENDING" || l.rollup.sdStatus === "PARTIAL").length;
  const fpPending = lots.filter((l) => l.rollup.fpStatus === "PENDING" || l.rollup.fpStatus === "PARTIAL").length;
  const short = lots.filter((l) => l.rollup.settleStatus === "SHORT" || l.rollup.settleStatus === "PARTIAL").length;
  const excess = lots.filter((l) => l.rollup.settleStatus === "EXCESS").length;
  const missingInv = lots.filter((l) => !l.rollup.hasInvoice).length;
  const missingSap = lots.filter((l) => !l.rollup.hasSap).length;

  const byAuction = auctions.map((a) => {
    const subset = lots.filter((l) => l.auctionId === a.id);
    const rec = subset.reduce((s, l) => s + l.totalReceivable, 0);
    const recd = subset.reduce((s, l) => s + l.rollup.totalReceived, 0);
    return {
      id: a.id,
      number: a.number,
      lots: subset.length,
      materialValue: subset.reduce((s, l) => s + l.materialValue, 0),
      receivable: rec,
      received: recd,
      outstanding: rec - recd,
    };
  });

  const buyerMap = new Map<string, { name: string; outstanding: number; receivable: number; received: number; lots: number }>();
  for (const l of lots) {
    const name = l.buyer?.name || "Unassigned";
    const cur = buyerMap.get(name) || { name, outstanding: 0, receivable: 0, received: 0, lots: 0 };
    cur.lots += 1;
    cur.receivable += l.totalReceivable;
    cur.received += l.rollup.totalReceived;
    cur.outstanding += l.rollup.outstanding;
    buyerMap.set(name, cur);
  }
  const byBuyer = Array.from(buyerMap.values()).sort((a, b) => b.outstanding - a.outstanding);

  const statusCounts = {
    RECEIVED: lots.filter((l) => l.rollup.settleStatus === "RECEIVED").length,
    SHORT: lots.filter((l) => l.rollup.settleStatus === "SHORT" || l.rollup.settleStatus === "PARTIAL").length,
    PENDING: lots.filter((l) => l.rollup.settleStatus === "PENDING").length,
    EXCESS: lots.filter((l) => l.rollup.settleStatus === "EXCESS").length,
  };

  const collections = new Map<string, number>();
  for (const l of lots) {
    for (const p of l.payments) {
      if (!p.receivedOn) continue;
      const key = p.receivedOn.toISOString().slice(0, 10);
      collections.set(key, (collections.get(key) || 0) + p.amount);
    }
  }
  const monthly = Array.from(collections.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  return {
    counts: {
      auctions: auctions.filter((a) => a.status === "OPEN").length,
      lots: lots.length,
      buyers: buyers.length,
      sdPending,
      fpPending,
      short,
      excess,
      missingInv,
      missingSap,
    },
    materialValue,
    receivable,
    received,
    outstanding,
    byAuction,
    byBuyer,
    statusCounts,
    monthly,
  };
}
