type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = typeof globalThis & {
  __goAccessRateLimits?: Map<string, RateLimitBucket>;
};

const rateLimitStore = globalThis as RateLimitStore;

function getStore() {
  rateLimitStore.__goAccessRateLimits ??= new Map<string, RateLimitBucket>();
  return rateLimitStore.__goAccessRateLimits;
}

function getClientAddress(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
) {
  const store = getStore();
  const now = Date.now();
  const key = `${scope}:${getClientAddress(request)}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;

  if (store.size > 10_000) {
    for (const [bucketKey, bucket] of store) {
      if (bucket.resetAt <= now) {
        store.delete(bucketKey);
      }
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
