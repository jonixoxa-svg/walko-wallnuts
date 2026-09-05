import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (pw: string, salt: string, len: number) => Promise<Buffer>;

/** scrypt hash, stored as "salt:hex". */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 32);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hex] = stored.split(":");
  try {
    const derived = await scrypt(password, salt, 32);
    const expected = Buffer.from(hex, "hex");
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

const SECRET = process.env.SESSION_SECRET || "walko-development-secret-change-me";

/** Signed, stateless-friendly session token (also stored server side). */
export function signToken(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const payload = Buffer.from(body, "base64url").toString();
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? payload : null;
}

export function randomId(prefix = ""): string {
  return prefix + randomBytes(9).toString("base64url");
}

/** Human-friendly temporary password for freshly created owner accounts. */
export function tempPassword(): string {
  const words = ["walnut", "orchard", "harvest", "kernel", "blossom", "valley", "canopy", "hazel"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${randomBytes(2).toString("hex")}`;
}
