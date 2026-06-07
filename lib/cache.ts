interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`fleksi_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`fleksi_cache_${key}`);
      return null;
    }
    return entry.data;
  } catch (e) {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    localStorage.setItem(`fleksi_cache_${key}`, JSON.stringify(entry));
  } catch (e) {
    limpiarCacheViejo();
  }
}

export function cacheInvalidate(key: string): void {
  try {
    localStorage.removeItem(`fleksi_cache_${key}`);
  } catch (e) {}
}

export function cacheInvalidatePrefix(prefix: string): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`fleksi_cache_${prefix}`));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

function limpiarCacheViejo(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('fleksi_cache_'));
    keys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
          localStorage.removeItem(k);
        }
      } catch (e) {
        localStorage.removeItem(k);
      }
    });
  } catch (e) {}
}

export const TTL = {
  PERFIL: 5 * 60 * 1000,
  SERVICIOS: 60 * 1000,
  NOTIFICACIONES: 30 * 1000,
  CATALOGO: 3 * 60 * 1000,
  BADGES: 10 * 60 * 1000,
  RESEÑAS: 5 * 60 * 1000,
};