import fs from "node:fs/promises";
import path from "node:path";

/**
 * Copies the runtime database and outbox into data/backups/<timestamp>/.
 * Run it from cron (daily) or before a deployment:  npm run backup
 * Keeps the ten most recent snapshots.
 */
const runtime = path.join(process.cwd(), "data", "runtime");
const backups = path.join(process.cwd(), "data", "backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const target = path.join(backups, stamp);

try {
  await fs.access(runtime);
} catch {
  console.error("Nothing to back up — data/runtime does not exist yet.");
  process.exit(1);
}

await fs.mkdir(target, { recursive: true });
for (const file of await fs.readdir(runtime)) {
  await fs.copyFile(path.join(runtime, file), path.join(target, file));
}

const uploads = path.join(process.cwd(), "public", "uploads");
try {
  const files = await fs.readdir(uploads);
  if (files.length) {
    await fs.mkdir(path.join(target, "uploads"), { recursive: true });
    for (const file of files) {
      await fs.copyFile(path.join(uploads, file), path.join(target, "uploads", file));
    }
  }
} catch {
  /* no field photos yet */
}

const kept = (await fs.readdir(backups)).sort();
for (const old of kept.slice(0, Math.max(0, kept.length - 10))) {
  await fs.rm(path.join(backups, old), { recursive: true, force: true });
}

console.log(`Backup written to data/backups/${stamp}`);
