type CacheEntry<T> = { expiresAt: number; value: T };

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getDiscoveryCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setDiscoveryCache<T>(key: string, value: T, ttlMs: number): void {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function discoveryCacheKey(parts: Record<string, unknown>): string {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${String(value ?? "")}`)
    .join("|");
}

