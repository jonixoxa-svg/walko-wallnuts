import "server-only";

type Bucket = { count: number; resetAt: number };

type Global = typeof globalThis & { __walkoRateBuckets?: Map<string, Bucket> };
const g = globalThis as Global;
const buckets = (g.__walkoRateBuckets ??= new Map<string, Bucket>());

/**
 * Small in-memory limiter for the public write endpoints. Enough to stop a
 * script hammering the contact form or guessing passwords on a single node;
 * put a real limiter (Redis, Cloudflare, Vercel WAF) in front in production.
 */
export function rateLimit(
  request: Request,
  scope: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { ok: true } | { ok: false; retryAfter: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const key = `${scope}:${ip}`;
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function tooManyRequests(retryAfter: number) {
  return new Response(JSON.stringify({ error: "rate_limited", retryAfter }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
