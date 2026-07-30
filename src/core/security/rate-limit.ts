/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance production, replace with Redis / Upstash.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= options.limit) {
    buckets.set(key, bucket);
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldest + options.windowMs,
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: options.limit - bucket.timestamps.length,
    resetAt: now + options.windowMs,
  };
}
