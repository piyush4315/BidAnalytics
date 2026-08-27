import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const DATE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "deletedAt",
  "lastLoginAt",
  "auctionDate",
  "receivedOn",
  "invoiceDate",
  "documentDate",
]);
const BOOL_FIELDS = new Set(["isActive"]);

type Rel = { table: string; kind: "one" | "many"; from: string; to: string };

const REL: Record<string, Record<string, Rel>> = {
  Lot: {
    auction: { table: "Auction", kind: "one", from: "auctionId", to: "id" },
    buyer: { table: "Buyer", kind: "one", from: "buyerId", to: "id" },
    payments: { table: "Payment", kind: "many", from: "id", to: "lotId" },
    invoices: { table: "Invoice", kind: "many", from: "id", to: "lotId" },
    sapDocuments: { table: "SapDocument", kind: "many", from: "id", to: "lotId" },
  },
  Payment: {
    lot: { table: "Lot", kind: "one", from: "lotId", to: "id" },
    createdBy: { table: "User", kind: "one", from: "createdById", to: "id" },
  },
  Invoice: {
    lot: { table: "Lot", kind: "one", from: "lotId", to: "id" },
    sapDocuments: { table: "SapDocument", kind: "many", from: "id", to: "invoiceId" },
  },
  SapDocument: {
    lot: { table: "Lot", kind: "one", from: "lotId", to: "id" },
    invoice: { table: "Invoice", kind: "one", from: "invoiceId", to: "id" },
  },
  AuditLog: {
    user: { table: "User", kind: "one", from: "userId", to: "id" },
  },
  ImportJob: {
    createdBy: { table: "User", kind: "one", from: "createdById", to: "id" },
  },
  Auction: {
    lots: { table: "Lot", kind: "many", from: "id", to: "auctionId" },
  },
  Buyer: {
    lots: { table: "Lot", kind: "many", from: "id", to: "buyerId" },
  },
};

function newId() {
  return "c" + randomBytes(16).toString("hex");
}

function iso(d: Date | string | null | undefined) {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return d;
}

function serialize(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

function decodeRow(row: Record<string, unknown> | undefined | null) {
  if (!row) return null;
  const out: Record<string, unknown> = { ...row };
  for (const k of Object.keys(out)) {
    if (DATE_FIELDS.has(k) && typeof out[k] === "string") out[k] = new Date(out[k] as string);
    if (BOOL_FIELDS.has(k)) out[k] = Boolean(out[k]);
  }
  return out;
}

type Where = Record<string, unknown> | undefined;

function compileWhere(where: Where): { sql: string; params: unknown[] } {
  if (!where || Object.keys(where).length === 0) return { sql: "1=1", params: [] };
  const parts: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(where)) {
    if (k === "OR" && Array.isArray(v)) {
      const subs = v.map((w) => compileWhere(w as Where));
      parts.push("(" + subs.map((s) => s.sql).join(" OR ") + ")");
      subs.forEach((s) => params.push(...s.params));
      continue;
    }
    if (v === null) {
      parts.push(`${k} IS NULL`);
      continue;
    }
    if (typeof v === "object" && v && !Array.isArray(v) && !(v instanceof Date)) {
      const obj = v as Record<string, unknown>;
      if ("contains" in obj) {
        parts.push(`${k} LIKE ?`);
        params.push(`%${obj.contains}%`);
        continue;
      }
      if ("in" in obj) {
        const arr = (obj.in as unknown[]) || [];
        if (!arr.length) {
          parts.push("0=1");
        } else {
          parts.push(`${k} IN (${arr.map(() => "?").join(",")})`);
          params.push(...arr.map(serialize));
        }
        continue;
      }
    }
    parts.push(`${k} = ?`);
    params.push(serialize(v));
  }
  return { sql: parts.join(" AND "), params };
}

function orderSql(orderBy: unknown): string {
  if (!orderBy) return "";
  if (Array.isArray(orderBy)) return orderSql(orderBy[0]);
  const e = Object.entries(orderBy as Record<string, string>)[0];
  if (!e) return "";
  const dir = String(e[1]).toUpperCase() === "DESC" ? "DESC" : "ASC";
  return ` ORDER BY ${e[0]} ${dir}`;
}

const globalForDb = globalThis as unknown as { __bidledgerDb?: DatabaseSync };

function openDb() {
  if (globalForDb.__bidledgerDb) return globalForDb.__bidledgerDb;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "bidledger.db"));
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  const sql = fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf8");
  db.exec(sql);
  globalForDb.__bidledgerDb = db;
  return db;
}

function selectRows(table: string, args: { where?: Where; orderBy?: unknown; take?: number } = {}) {
  const db = openDb();
  const w = compileWhere(args.where);
  let sql = `SELECT * FROM ${table} WHERE ${w.sql}${orderSql(args.orderBy)}`;
  if (args.take) sql += ` LIMIT ${Number(args.take)}`;
  const rows = db.prepare(sql).all(...w.params) as Record<string, unknown>[];
  return rows.map((r) => decodeRow(r)!) as Record<string, unknown>[];
}

function hydrate(table: string, rows: Record<string, unknown>[], include: unknown) {
  if (!include || !rows.length) return rows;
  const spec = include as Record<string, unknown>;
  for (const [key, raw] of Object.entries(spec)) {
    if (!raw) continue;
    const rel = REL[table]?.[key];
    if (!rel) continue;
    const nested = typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const nestedInclude = nested.include;
    const nestedWhere = nested.where as Where;
    const nestedOrder = nested.orderBy;
    if (rel.kind === "one") {
      const ids = [...new Set(rows.map((r) => r[rel.from]).filter(Boolean))];
      const related = ids.length ? selectRows(rel.table, { where: { id: { in: ids } } }) : [];
      if (nestedInclude) hydrate(rel.table, related, nestedInclude);
      const map = new Map(related.map((r) => [r.id, r]));
      rows.forEach((r) => {
        r[key] = r[rel.from] ? map.get(r[rel.from] as string) ?? null : null;
      });
    } else {
      const ids = rows.map((r) => r[rel.from]);
      const related = ids.length
        ? selectRows(rel.table, {
            where: { [rel.to]: { in: ids }, ...(nestedWhere || {}) },
            orderBy: nestedOrder,
          })
        : [];
      if (nestedInclude) hydrate(rel.table, related, nestedInclude);
      const grouped = new Map<string, Record<string, unknown>[]>();
      related.forEach((r) => {
        const k = String(r[rel.to] ?? "");
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k)!.push(r);
      });
      rows.forEach((r) => {
        r[key] = grouped.get(String(r[rel.from] ?? "")) || [];
      });
    }
  }
  return rows;
}

function model(table: string) {
  return {
    findMany(args: { where?: Where; include?: unknown; orderBy?: unknown; take?: number } = {}) {
      const rows = selectRows(table, args);
      if (args.include) hydrate(table, rows, args.include);
      return Promise.resolve(rows as never);
    },
    findFirst(args: { where?: Where; include?: unknown; orderBy?: unknown } = {}) {
      const rows = selectRows(table, { ...args, take: 1 });
      if (args.include) hydrate(table, rows, args.include);
      return Promise.resolve((rows[0] as never) ?? null);
    },
    findUnique(args: { where: Where; include?: unknown; select?: unknown }) {
      const rows = selectRows(table, { where: args.where, take: 1 });
      if (args.include) hydrate(table, rows, args.include);
      const row = rows[0] ?? null;
      if (row && args.select) {
        const picked: Record<string, unknown> = {};
        for (const k of Object.keys(args.select as object)) picked[k] = row[k];
        return Promise.resolve(picked as never);
      }
      return Promise.resolve(row as never);
    },
    create(args: { data: Record<string, unknown> }) {
      const db = openDb();
      const data = { ...args.data };
      if (!data.id) data.id = newId();
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      if (table !== "AuditLog" && table !== "ImportJob" && !data.updatedAt) data.updatedAt = new Date().toISOString();
      if (table === "ImportJob" && !data.createdAt) data.createdAt = new Date().toISOString();
      const keys = Object.keys(data);
      const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`;
      db.prepare(sql).run(...keys.map((k) => serialize(data[k])));
      return Promise.resolve(decodeRow(data)! as never);
    },
    update(args: { where: { id: string }; data: Record<string, unknown> }) {
      const db = openDb();
      const data = { ...args.data, updatedAt: iso(new Date()) };
      const keys = Object.keys(data);
      const sql = `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`;
      db.prepare(sql).run(...keys.map((k) => serialize(data[k])), args.where.id);
      const row = selectRows(table, { where: { id: args.where.id }, take: 1 })[0];
      return Promise.resolve(row as never);
    },
    deleteMany() {
      openDb().prepare(`DELETE FROM ${table}`).run();
      return Promise.resolve({ count: 0 });
    },
    count(args: { where?: Where } = {}) {
      const db = openDb();
      const w = compileWhere(args.where);
      const row = db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE ${w.sql}`).get(...w.params) as { c: number };
      return Promise.resolve(row.c);
    },
  };
}

export const prisma = {
  user: model("User"),
  taxConfig: model("TaxConfig"),
  auction: model("Auction"),
  buyer: model("Buyer"),
  lot: model("Lot"),
  payment: model("Payment"),
  invoice: model("Invoice"),
  sapDocument: model("SapDocument"),
  auditLog: model("AuditLog"),
  importJob: model("ImportJob"),
  $disconnect: async () => {
    /* keep the singleton open in Next.js */
  },
};

export function getSqlite() {
  return openDb();
}
