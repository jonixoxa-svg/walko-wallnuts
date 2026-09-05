import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { Database, Order, Owner, Tree } from "./model";
import { buildDatabase } from "./seed";

const DIR = path.join(process.cwd(), "data", "runtime");
const FILE = path.join(DIR, "db.json");

type Global = typeof globalThis & {
  __walkoDb?: Database;
  __walkoDbPromise?: Promise<Database>;
  __walkoWriteQueue?: Promise<void>;
};
const g = globalThis as Global;

async function load(): Promise<Database> {
  await fs.mkdir(DIR, { recursive: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const raw = await fs.readFile(FILE, "utf8");
      const parsed = JSON.parse(raw) as Database;
      if (parsed?.trees?.length) return parsed;
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") break;
      // A concurrent first-run write may be in flight — wait and retry once.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  const fresh = await buildDatabase();
  await persist(fresh);
  return fresh;
}

async function persist(db: Database): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db), "utf8");
  await fs.rename(tmp, FILE);
}

/** Shared, cached database instance. Reservations expire lazily on read. */
export async function getDb(): Promise<Database> {
  if (g.__walkoDb) return g.__walkoDb;
  if (!g.__walkoDbPromise) {
    g.__walkoDbPromise = load().then((db) => {
      g.__walkoDb = db;
      return db;
    });
  }
  const db = await g.__walkoDbPromise;
  releaseExpired(db);
  return db;
}

function releaseExpired(db: Database) {
  const now = new Date().toISOString();
  for (const tree of db.trees) {
    if (tree.status === "reserved" && tree.reservedUntil && tree.reservedUntil < now) {
      tree.status = "available";
      delete tree.reservedUntil;
    }
  }
  db.sessions = db.sessions.filter((s) => s.expires > now);
}

/** Serialised read-modify-write so concurrent requests cannot clobber the file. */
export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await getDb();
  const run = async () => {
    const result = await fn(db);
    await persist(db);
    return result;
  };
  const chained = (g.__walkoWriteQueue ?? Promise.resolve()).then(run, run);
  g.__walkoWriteQueue = chained.then(
    () => undefined,
    () => undefined
  );
  return chained;
}

/* ------------------------------------------------------------------ reads */

export async function getTrees(): Promise<Tree[]> {
  return (await getDb()).trees;
}

export async function getTree(code: string): Promise<Tree | undefined> {
  const db = await getDb();
  const wanted = code.toUpperCase();
  return db.trees.find((t) => t.code === wanted);
}

export async function getTreesByCodes(codes: string[]): Promise<Tree[]> {
  const db = await getDb();
  const set = new Set(codes.map((c) => c.toUpperCase()));
  return db.trees.filter((t) => set.has(t.code));
}

export async function getOwner(id: string): Promise<Owner | undefined> {
  return (await getDb()).owners.find((o) => o.id === id);
}

export async function getOwnerByEmail(email: string): Promise<Owner | undefined> {
  const db = await getDb();
  const wanted = email.trim().toLowerCase();
  return db.owners.find((o) => o.email.toLowerCase() === wanted);
}

export async function getOwnerTrees(ownerId: string): Promise<Tree[]> {
  const db = await getDb();
  return db.trees.filter((t) => t.ownerId === ownerId).sort((a, b) => a.n - b.n);
}

export async function getOwnerOrders(ownerId: string): Promise<Order[]> {
  const db = await getDb();
  return db.orders.filter((o) => o.ownerId === ownerId);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return (await getDb()).orders.find((o) => o.id === id);
}

export interface Stats {
  total: number;
  sold: number;
  available: number;
  reserved: number;
  soldPercent: number;
  revenue: number;
  owners: number;
  lastHarvestTotal: number;
  updatedAt: string;
}

export async function getStats(): Promise<Stats> {
  const db = await getDb();
  const total = db.trees.length;
  const sold = db.trees.filter((t) => t.status === "sold").length;
  const reserved = db.trees.filter((t) => t.status === "reserved").length;
  const available = total - sold - reserved;
  const lastYear = 2025;
  const lastHarvestTotal = db.trees.reduce(
    (sum, t) => sum + (t.harvests.find((h) => h.year === lastYear)?.kg ?? 0),
    0
  );
  return {
    total,
    sold,
    available,
    reserved,
    soldPercent: Math.round((sold / total) * 1000) / 10,
    revenue: db.orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.total, 0),
    owners: db.owners.filter((o) => o.role === "owner").length,
    lastHarvestTotal: Math.round(lastHarvestTotal),
    updatedAt: new Date().toISOString(),
  };
}
