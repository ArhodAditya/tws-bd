import { createHash, timingSafeEqual } from "node:crypto";

// Constant-time comparison for secrets (e.g. the cron Bearer token). Both inputs
// are SHA-256'd first so the comparison always runs over equal-length 32-byte
// buffers: timingSafeEqual never throws on a length mismatch, and the secret's
// length isn't leaked through early-exit timing the way `===` / `!==` is.
export function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
