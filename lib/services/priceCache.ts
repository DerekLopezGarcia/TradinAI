/**
 * Servicio de caché para precios de activos
 * Evita peticiones duplicadas dentro de un periodo de tiempo
 */

import { validateSymbol, createSafeParams } from './validationService';

interface CachedPrice {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface PriceRequest {
  symbol: string;
  resolve: (value: CachedPrice) => void;
  reject: (error: Error) => void;
}

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();
  private cacheExpiryMs = 30000; // 30 segundos de caché
  private requestQueue: PriceRequest[] = [];
  private batchProcessing = false;
  private batchSize = 10;
  private batchDelayMs = 500;
  private maxCacheSize = 1000; // Prevenir memory leak

  /**
   * Obtiene un precio del caché si es válido
   */
  get(symbol: string): CachedPrice | null {
    if (!validateSymbol(symbol)) return null;
    
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
    if (!validateSymbol(symbol)) return;
    if (!this.isValidPrice(price, change, changePercent)) return;
    
    // Implementar límite de caché para evitar memory leak
    if (this.cache.size >= this.maxCacheSize) {
      // Remover entrada más antigua
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(symbol, {
      price,
      change,
      changePercent,
      timestamp: Date.now(),
    });
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
        // Tomar los primeros batchSize símbolos
        const batch = this.requestQueue.splice(0, this.batchSize);
        const symbols = batch
          .map(r => r.symbol)
          .filter(s => validateSymbol(s)); // Validar antes de enviar

        if (symbols.length === 0) {
          batch.forEach(r => r.reject(new Error('Invalid symbol')));
          continue;
        }

        try {
          // Usar URLSearchParams seguro
          const params = createSafeParams({
            symbols: symbols.join(','),
            type: 'price'
          });

          const res = await fetch(`/api/market?${params.toString()}`);
          
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }

          const data = await res.json();
          
          // Validar que la respuesta sea un array
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format');
          }
          
          // Procesar respuesta
          if (Array.isArray(data)) {
            data.forEach((item: any, index: number) => {
              const request = batch[index];
              if (request && item && item.price && !isNaN(item.price)) {
                const price = {
                  price: Number(item.price),
                  change: Number(item.change || 0),
                  changePercent: Number(item.changePercent || 0),
                  timestamp: Date.now(),
                };
                
                // Validar y guardar en caché
                if (this.isValidPrice(price.price, price.change, price.changePercent)) {
                  this.set(request.symbol, price.price, price.change, price.changePercent);
                  request.resolve(price);
                } else {
                  request.reject(new Error('Invalid price data'));
                }
              }
            });
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Error fetching prices');
          batch.forEach(r => r.reject(err));
        }

        // Delay entre lotes para evitar rate limiting
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
    // Validar símbolo
    if (!validateSymbol(symbol)) {
      throw new Error('Invalid symbol format');
    }

    // Primero verificar caché
    const cached = this.get(symbol);
    if (cached) {
      return cached;
    }

    // Crear promise que se resolverá cuando se procese el batch
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ symbol, resolve, reject });
      
      // Iniciar procesamiento de batch
      // setTimeout para permitir que se agreguen más símbolos en el mismo ciclo
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

