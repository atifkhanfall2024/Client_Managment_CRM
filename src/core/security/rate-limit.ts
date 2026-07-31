/**
 * In-memory sliding-window rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance production, replace with Redis / Upstash.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function pruneBucket(bucket: Bucket, windowStart: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);
}

/** Evict oldest idle keys so memory stays bounded under heavy traffic. */
function evictIfNeeded() {
  if (buckets.size <= MAX_BUCKETS) return;
  const overflow = buckets.size - MAX_BUCKETS;
  let removed = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };

  pruneBucket(bucket, windowStart);

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
  evictIfNeeded();

  return {
    allowed: true,
    remaining: options.limit - bucket.timestamps.length,
    resetAt: now + options.windowMs,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimitBuckets() {
  buckets.clear();
}

export function rateLimitBucketCount() {
  return buckets.size;
}
