/**
 * Servicio de caché para precios de activos
 * Evita peticiones duplicadas dentro de un periodo de tiempo
 */

interface CachedPrice {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();
  private cacheExpiryMs = 60000; // 60 segundos de caché

  /**
   * Obtiene un precio del caché si es válido
   */
  get(symbol: string): CachedPrice | null {
    const cached = this.cache.get(symbol);
    
    if (!cached) return null;
    
    // Si el caché es más viejo de lo permitido, descartarlo
    if (Date.now() - cached.timestamp > this.cacheExpiryMs) {
      this.cache.delete(symbol);
      return null;
    }
    
    return cached;
  }

  /**
   * Guarda un precio en caché
   */
  set(symbol: string, price: number, change: number, changePercent: number): void {
    this.cache.set(symbol, {
      price,
      change,
      changePercent,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpia el caché completamente
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpia entradas expiradas
   */
  cleanExpired(): void {
    const now = Date.now();
    
    for (const [symbol, data] of this.cache.entries()) {
      if (now - data.timestamp > this.cacheExpiryMs) {
        this.cache.delete(symbol);
      }
    }
  }
}

export const priceCache = new PriceCache();

