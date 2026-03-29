// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = 30_000): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// Cached fetch wrapper — deduplicates concurrent requests for the same URL.
// Accepts optional RequestInit so auth headers are forwarded correctly.
const inflight = new Map<string, Promise<any>>();

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttlMs = 30_000
): Promise<T> {
  const cached = getCached<T>(url);
  if (cached) return cached;

  // Deduplicate concurrent requests for the same URL
  if (inflight.has(url)) return inflight.get(url)!;

  const promise = fetch(url, options)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      setCached(url, data, ttlMs);
      inflight.delete(url);
      return data as T;
    })
    .catch((err) => {
      inflight.delete(url);
      throw err;
    });

  inflight.set(url, promise);
  return promise;
}
