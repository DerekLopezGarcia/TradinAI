import { CandleData, TimeFrame } from '@/lib/types';

/**
 * Servicio para obtener datos históricos de Binance API
 * Proporciona velas con excelente resolución y sin rate limiting restrictivo
 */

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

class BinanceService {
  private baseUrl = 'https://api.binance.com/api/v3';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 60000; // 1 minuto

  /**
   * Mapeo de TimeFrame a Binance interval
   */
  private getInterval(timeframe: TimeFrame): string {
    const map: Record<TimeFrame, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w',
    };
    return map[timeframe] || '1d';
  }

  /**
   * Convierte símbolo (BTCUSD) a símbolo Binance (BTCUSDT)
   * Incluye mapeos especiales para símbolos que Binance no soporta con USDT
   */
  private normalizePair(symbol: string): string {
    // Mapeos especiales para pares que no existen en USDT pero sí en otros
    const specialMappings: Record<string, string> = {
      'LTCUSD': 'LTCUSDT',    // Litecoin → LTCUSDT (si falla, usar LTCBTC)
      'DOTUSD': 'DOTUSDT',    // Polkadot → DOTUSDT
      'LTCBTC': 'LTCBTC',     // Litecoin vs Bitcoin (fallback)
    };
    
    if (specialMappings[symbol]) {
      return specialMappings[symbol];
    }
    
    // BTCUSD → BTCUSDT, ETHUSD → ETHUSDT, etc.
    if (symbol.endsWith('USD')) {
      return symbol.replace('USD', 'USDT');
    }
    // Si ya es USDT, mantenerlo
    if (symbol.includes('USDT')) {
      return symbol;
    }
    // Default: agregar USDT
    return symbol + 'USDT';
  }

  /**
   * Obtiene el número de velas límite según el timeframe
   */
  private getLimit(timeframe: TimeFrame): number {
    // Binance límite es 1000 por defecto, pero podemos pedir menos
    const limits: Record<TimeFrame, number> = {
      '1m': 1000,   // ~16 horas
      '5m': 1000,   // ~3.5 días
      '15m': 1000,  // ~10 días
      '1h': 500,    // ~20 días
      '4h': 500,    // ~83 días
      '1d': 365,    // ~1 año
      '1w': 200,    // ~4 años
    };
    return limits[timeframe] || 500;
  }

  /**
   * Obtiene datos históricos de Binance
   */
  async getHistoricalCandles(
    symbol: string,
    interval: TimeFrame
  ): Promise<CandleData[]> {
    const cacheKey = `binance:${symbol}:${interval}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const pair = this.normalizePair(symbol);
      const binanceInterval = this.getInterval(interval);
      const limit = this.getLimit(interval);

      const url = `${this.baseUrl}/klines?symbol=${pair}&interval=${binanceInterval}&limit=${limit}`;
      
      if (symbol === 'LTCUSD') {
        console.log(`🔄 Binance: Intentando obtener LTCUSD → ${pair}`);
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Trading IA)',
        },
      });

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const klines: any[][] = await response.json();

      if (!Array.isArray(klines) || klines.length === 0) {
        throw new Error('No kline data received');
      }

      // Convertir formato Binance a nuestro formato CandleData
      const candles: CandleData[] = klines.map((kline) => ({
        time: kline[0], // openTime en ms
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[7]), // quoteAssetVolume (volumen en USD)
      }));

      // Validar datos
      const validCandles = candles.filter(
        (c) =>
          !isNaN(c.open) &&
          !isNaN(c.high) &&
          !isNaN(c.low) &&
          !isNaN(c.close) &&
          c.high >= c.low &&
          c.high >= c.open &&
          c.high >= c.close &&
          c.low <= c.open &&
          c.low <= c.close
      );

      // Cachear resultado
      this.cache.set(cacheKey, {
        data: validCandles,
        timestamp: Date.now(),
      });

      if (symbol === 'LTCUSD' && validCandles.length > 0) {
        console.log(`✅ Binance: Obtuvo ${validCandles.length} candles para LTCUSD`);
      }

      return validCandles;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (symbol === 'LTCUSD') {
        console.warn(`⚠️ Binance: Fallo para LTCUSD: ${errorMsg}`);
        console.log(`   Razón probable: ${errorMsg.includes('401') ? 'No autorizado' : errorMsg.includes('404') ? 'Par no existe en Binance' : 'Timeout o conexión'}`);
      }
      
      throw error;
    }
  }

  /**
   * Obtiene precio actual desde Binance
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const pair = this.normalizePair(symbol);
      const url = `${this.baseUrl}/ticker/price?symbol=${pair}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance ticker error: ${response.status}`);
      }

      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error(`[BinanceService] Error fetching price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Limpia la caché (útil para cambios de símbolo)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene información de 24h (cambio, volumen, etc.)
   */
  async get24hData(symbol: string): Promise<any> {
    try {
      const pair = this.normalizePair(symbol);
      const url = `${this.baseUrl}/ticker/24hr?symbol=${pair}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Binance 24h stats error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[BinanceService] Error fetching 24h data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el precio desde medianoche (00:00 UTC) del día actual
   * Útil para criptos que operan 24/7
   */
  async getPriceSinceMidnight(symbol: string): Promise<{ currentPrice: number; priceAtMidnight: number; change: number; changePercent: number }> {
    try {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(0, 0, 0, 0);

      const pair = this.normalizePair(symbol);
      
      // Obtener precio actual
      const currentPrice = await this.getCurrentPrice(symbol);
      
      // Obtener velas desde medianoche
      const url = `${this.baseUrl}/klines?symbol=${pair}&interval=1h&startTime=${midnight.getTime()}&limit=24`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.status}`);
      }

      const klines: any[][] = await response.json();
      const priceAtMidnight = klines.length > 0 ? parseFloat(klines[0][1]) : currentPrice; // open price del primer candle

      const change = currentPrice - priceAtMidnight;
      const changePercent = (change / priceAtMidnight) * 100;

      return { currentPrice, priceAtMidnight, change, changePercent };
    } catch (error) {
      console.error(`[BinanceService] Error fetching midnight price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el precio desde una hora específica
   */
  async getPriceSinceHour(symbol: string, hourUTC: number): Promise<{ currentPrice: number; priceAtHour: number; change: number; changePercent: number }> {
    try {
      const now = new Date();
      const targetHour = new Date(now);
      targetHour.setUTCHours(hourUTC, 0, 0, 0);

      const pair = this.normalizePair(symbol);
      
      const currentPrice = await this.getCurrentPrice(symbol);
      
      const url = `${this.baseUrl}/klines?symbol=${pair}&interval=1h&startTime=${targetHour.getTime()}&limit=24`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error fetching klines: ${response.status}`);
      }

      const klines: any[][] = await response.json();
      const priceAtHour = klines.length > 0 ? parseFloat(klines[0][1]) : currentPrice;

      const change = currentPrice - priceAtHour;
      const changePercent = (change / priceAtHour) * 100;

      return { currentPrice, priceAtHour, change, changePercent };
    } catch (error) {
      console.error(`[BinanceService] Error fetching price since hour for ${symbol}:`, error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const binanceService = new BinanceService();

