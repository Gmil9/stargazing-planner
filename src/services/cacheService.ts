interface CacheEntry<T> {
  data: T
  expiresAt: number
}

function get<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function set<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — skip caching
  }
}

export const cacheService = { get, set }
