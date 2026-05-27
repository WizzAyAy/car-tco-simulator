import { LRUCache } from 'lru-cache'

export type CachedFetcher<T> = {
  get: () => Promise<T>
  invalidate: () => void
}

const sharedCache = new LRUCache<string, object>({
  max: 200,
  ttl: 1000 * 60 * 60,
})

export function memoizeWithTTL<T extends object>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): CachedFetcher<T> {
  return {
    async get() {
      const hit = sharedCache.get(key) as T | undefined
      if (hit !== undefined)
        return hit
      const fresh = await fetcher()
      sharedCache.set(key, fresh, { ttl: ttlMs })
      return fresh
    },
    invalidate() {
      sharedCache.delete(key)
    },
  }
}
