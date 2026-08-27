# BidLedger

Internal SaaS for MSTC-style scrap auction bid sheets: lots, buyers, tax calculations, security deposits, final payments, invoices and SAP documents.

The Combined Bid Sheet dated **23.08.2026** (auctions 21977–21980) is the source of the seeded operating data. The application is not an Excel viewer — it is a normalised operations ledger with a configurable calculation engine.

## Sign in

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@bidledger.local | Admin@123 |
| Manager | manager@bidledger.local | Manager@123 |
| Data entry | entry@bidledger.local | Entry@123 |
| Viewer | viewer@bidledger.local | Viewer@123 |

## Run locally

Requires **Node.js 22+** (uses the built-in `node:sqlite` module).

```bash
npm install
npx tsx prisma/seed.ts
npm run dev
```

App listens on `0.0.0.0:3000`.

Production:

```bash
npm run build
npm start
```

## Deploy (public URL for phone / internet)

The app is a long-running Node server with SQLite. It will not run on Vercel serverless. Use a host with a persistent process:

### Render (easiest)

1. Open [Render New Web Service](https://dashboard.render.com/select-repo?type=web) and connect this GitHub repo.
2. Render picks up `render.yaml`:
   - Build: `npm ci && npm run build`
   - Start: `node scripts/boot.mjs`
   - Node 22
3. After deploy, open `https://<service>.onrender.com` on any phone browser.
4. Sign in with `admin@bidledger.local` / `Admin@123`.

### Docker

```bash
docker build -t bidledger .
docker run -p 3000:3000 -e AUTH_SECRET=change-me bidledger
```

### Railway / Fly

Use the same start command `node scripts/boot.mjs` and Node 22. Set `AUTH_SECRET`.

First boot seeds the Combined Bid Sheet automatically. Later boots keep existing data unless `FORCE_SEED=1`.

## Calculation (from the source sheet)

```
GST                 = ROUND(MV × 18%, 0)
TCS                 = ROUND((MV + GST) × 2%, 0)
TDS 194(O)          = MV × 0.10%
Service charge      = MV × 2.25% × 118%
TDS 194(H)          = MV × 2.25% × 2%
SC to MSTC          = ROUND(net SC + TDS 194(O), 0)
GST TDS             = ROUND(MV × lot GST TDS rate, 0)
Total cash recv.    = ROUND(MV × 117.65% − GST TDS, 0)
SD expected         = ROUND(MV × 25%, 0)
FP expected         = ROUND(MV × 92.65% − GST TDS, 0)
Short/(excess)      = cash recv. − SD received − FP received
```

117.65% is stored as a configurable cash factor. The sheet does not document a statutory identity for the 0.35% gap versus 118%; administrators can change the factor without a code change.

GST TDS is **per lot** (0% or 2% in the sample). TCS and MSTC service charge are calculated for disclosure and are not added to buyer cash receivable.

## What is intentionally not assumed

- Buyer GSTIN, contacts and bank details (absent from the sheet)
- Auction dates (not on the sheet; seeded as 01 Aug 2026 as a placeholder)
- Statutory meaning of 117.65% beyond the Excel formula
- Payment bank references (not on the sheet)

## Stack

Next.js 14 (App Router) · TypeScript · SQLite (`node:sqlite`) · server-side calculation engine · role-based access · audit log.
