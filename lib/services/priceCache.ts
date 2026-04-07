/**
 * Servicio de caché para precios de activos
 * T1.4: Cache inteligente con TTL variable por proveedor y fallback stale
 */

import { validateSymbol, createSafeParams } from './validationService';

interface CachedPrice {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  provider?: string;
  isStale?: boolean;
}

interface PriceRequest {
  symbol: string;
  resolve: (value: CachedPrice) => void;
  reject: (error: Error) => void;
}

// T1.4: TTL variable por proveedor
const PROVIDER_TTL: Record<string, number> = {
  'BINANCE': 30000,        // 30s - casi tiempo real, high volume
  'CRYPTO': 30000,         // 30s - CoinGecko, YahooFinance
  'STOCK': 60000,          // 60s - Yahoo, menos volatilidad
  'FOREX': 45000,          // 45s - medio
  'INDEX': 60000,          // 60s - indices no tan volatiles
  'COMMODITY': 45000,      // 45s - medio
  'DEFAULT': 30000,        // 30s - default
};

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();
  private requestQueue: PriceRequest[] = [];
  private batchProcessing = false;
  private batchSize = 10;
  private batchDelayMs = 500;
  private maxCacheSize = 1000;

  /**
   * T1.4: Obtiene TTL según proveedor/tipo de activo
   */
  private getTTL(provider?: string): number {
    if (!provider) return PROVIDER_TTL.DEFAULT;
    const key = provider.toUpperCase();
    return PROVIDER_TTL[key] || PROVIDER_TTL.DEFAULT;
  }

  /**
   * T1.4: Obtiene un precio del caché si es válido (no expirado)
   */
  get(symbol: string, provider?: string): CachedPrice | null {
    if (!validateSymbol(symbol)) return null;
    
    const cached = this.cache.get(symbol);
    if (!cached) return null;
    
    const ttl = this.getTTL(provider);
    const now = Date.now();
    
    // Si no está expirado, retornar
    if (now - cached.timestamp <= ttl) {
      return cached;
    }
    
    // Está expirado pero podría ser útil como stale
    return null;
  }

  /**
   * T1.4: Obtiene precio del caché aunque esté expirado (stale)
   * Usado como fallback cuando API falla
   * Retorna null si no hay nada en caché
   */
  getStale(symbol: string): CachedPrice | null {
    if (!validateSymbol(symbol)) return null;
    const cached = this.cache.get(symbol);
    
    if (!cached) return null;
    
    // Marcar como stale para que el cliente sepa
    return {
      ...cached,
      isStale: true,
    };
  }

  /**
   * T1.4: Obtiene precio del caché con fallback a stale
   * Primero intenta obtener precio válido
   * Si expira, intenta obtener stale (mejor que nada)
   */
  getOrStale(symbol: string, provider?: string): CachedPrice | null {
    if (!validateSymbol(symbol)) return null;
    
    // Intentar obtener precio válido
    const valid = this.get(symbol, provider);
    if (valid) return valid;
    
    // Fallback a stale
    return this.getStale(symbol);
  }

  /**
   * Guarda un precio en caché
   */
  set(symbol: string, price: number, change: number, changePercent: number, provider?: string): void {
    if (!validateSymbol(symbol)) return;
    if (!this.isValidPrice(price, change, changePercent)) return;
    
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(symbol, {
      price,
      change,
      changePercent,
      timestamp: Date.now(),
      provider,
      isStale: false,
    });
  }

  /**
   * T1.4: Invalida entrada de caché (cuando hay cambios en tiempo real)
   */
  invalidate(symbol: string): void {
    if (validateSymbol(symbol)) {
      this.cache.delete(symbol);
    }
  }

  /**
   * T1.4: Invalida múltiples símbolos (broadcast de cambios)
   */
  invalidateMultiple(symbols: string[]): void {
    symbols.forEach(symbol => this.invalidate(symbol));
  }

  /**
   * Valida que los valores de precio sean números válidos
   */
  private isValidPrice(price: number, change: number, changePercent: number): boolean {
    return (
      typeof price === 'number' && !isNaN(price) && isFinite(price) && price > 0 &&
      typeof change === 'number' && !isNaN(change) && isFinite(change) &&
      typeof changePercent === 'number' && !isNaN(changePercent) && isFinite(changePercent)
    );
  }

  /**
   * Limpia el caché completamente
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * T1.4: Limpia entradas expiradas (garbage collection)
   */
  cleanExpired(provider?: string): number {
    const now = Date.now();
    const ttl = this.getTTL(provider);
    let removed = 0;
    
    for (const [symbol, data] of this.cache.entries()) {
      if (now - data.timestamp > ttl) {
        this.cache.delete(symbol);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * T1.4: Obtiene estadísticas de caché
   */
  getStats(): {
    totalCached: number;
    validCount: number;
    staleCount: number;
    oldestEntry?: number;
  } {
    const now = Date.now();
    let validCount = 0;
    let staleCount = 0;
    let oldestEntry: number | undefined;

    for (const [, data] of this.cache.entries()) {
      const ttl = PROVIDER_TTL[data.provider?.toUpperCase() || ''] || PROVIDER_TTL.DEFAULT;
      if (now - data.timestamp <= ttl) {
        validCount++;
      } else {
        staleCount++;
      }
      if (!oldestEntry || data.timestamp < oldestEntry) {
        oldestEntry = data.timestamp;
      }
    }

    return {
      totalCached: this.cache.size,
      validCount,
      staleCount,
      oldestEntry,
    };
  }

  /**
   * Procesa un lote de solicitudes de precios con throttling
   */
  private async processBatch(): Promise<void> {
    if (this.batchProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.batchProcessing = true;

    try {
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.batchSize);
        const symbols = batch
          .map(r => r.symbol)
          .filter(s => validateSymbol(s));

        if (symbols.length === 0) {
          batch.forEach(r => r.reject(new Error('Invalid symbol')));
          continue;
        }

        try {
          const params = createSafeParams({
            symbols: symbols.join(','),
            type: 'price'
          });

          const res = await fetch(`/api/market?${params.toString()}`);
          
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }

          const data = await res.json();
          
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format');
          }
          
          if (Array.isArray(data)) {
            data.forEach((item: any, index: number) => {
              const request = batch[index];
              if (request && item && item.price && !isNaN(item.price)) {
                const price = {
                  price: Number(item.price),
                  change: Number(item.change || 0),
                  changePercent: Number(item.changePercent || 0),
                  timestamp: Date.now(),
                  provider: item.source || 'API',
                  isStale: false,
                };
                
                if (this.isValidPrice(price.price, price.change, price.changePercent)) {
                  this.set(request.symbol, price.price, price.change, price.changePercent, item.source);
                  request.resolve(price);
                } else {
                  // T1.4: Usar stale como fallback
                  const stale = this.getStale(request.symbol);
                  if (stale) {
                    request.resolve(stale);
                  } else {
                    request.reject(new Error('Invalid price data'));
                  }
                }
              }
            });
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Error fetching prices');
          // T1.4: Intentar fallback con stale prices
          batch.forEach(r => {
            const stale = this.getStale(r.symbol);
            if (stale) {
              r.resolve(stale);
            } else {
              r.reject(err);
            }
          });
        }

        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelayMs));
        }
      }
    } finally {
      this.batchProcessing = false;
    }
  }

  /**
   * Fetch de precio con batching automático
   */
  async fetchPrice(symbol: string): Promise<CachedPrice> {
    if (!validateSymbol(symbol)) {
      throw new Error('Invalid symbol format');
    }

    const cached = this.get(symbol);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      this.requestQueue.push({ symbol, resolve, reject });
      setTimeout(() => this.processBatch(), 10);
    });
  }

  /**
   * Fetch de múltiples precios con batching
   */
  async fetchPrices(symbols: string[]): Promise<Map<string, CachedPrice>> {
    const promises = symbols.map(symbol => 
      this.fetchPrice(symbol).catch(() => null)
    );
    
    const results = await Promise.all(promises);
    const priceMap = new Map<string, CachedPrice>();
    
    results.forEach((result, index) => {
      if (result) {
        priceMap.set(symbols[index], result);
      }
    });
    
    return priceMap;
  }
}

export const priceCache = new PriceCache();

