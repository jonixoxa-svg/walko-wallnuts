import fs from "node:fs/promises";
import path from "node:path";

/**
 * Removes the runtime database and outbox. The next request rebuilds the
 * orchard from lib/seed.ts — deterministic, so the same 2,000 trees come back.
 */
const dir = path.join(process.cwd(), "data", "runtime");
await fs.rm(dir, { recursive: true, force: true });
console.log("Runtime data cleared. Stop the dev server first — the next start reseeds the orchard.");
