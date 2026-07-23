// Lightweight in-memory fixed-window rate limiter.
//
// NOTE: state lives in the process, so on serverless (multiple / ephemeral
// instances) limits are enforced PER INSTANCE, not globally. That's meaningful
// protection against single-source spam hitting a warm instance, but for strict
// distributed limits move to Upstash Ratelimit or the Vercel WAF. Kept
// dependency-free on purpose. The interface (a pure `rateLimit(key,…)` call) is
// drop-in replaceable by a Redis-backed limiter later.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

// Returns whether the call for `key` is within `limit` hits per `windowMs`, and
// consumes one hit when it is allowed.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the Map can't grow unbounded from unique keys.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

// Best-effort client IP from proxy headers (Vercel/other reverse proxies set
// these). Falls back to a shared "unknown" bucket when absent.
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
