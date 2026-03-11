import { CandleData, TimeFrame } from '@/lib/types';

/**
 * Servicio centralizado para todas las APIs de mercado
 * Soporta: CoinGecko, Finnhub, NewsAPI, Alpha Vantage
 * Incluye caching, fallback y rate limiting
 */

// ==================== TIPOS ====================

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  sparkline: number[];
  lastUpdated: number;
}

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  priceChangePercentage24h: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
}

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  image?: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ==================== CONSTANTES ====================

const API_TIMEOUTS = {
  COINGECKO_PRICE: 30000, // 30 segundos
  COINGECKO_HISTORY: 600000, // 10 minutos
  FINNHUB_QUOTE: 5000, // 5 segundos
  FINNHUB_CANDLES: 300000, // 5 minutos
  NEWSAPI: 300000, // 5 minutos
  ALPHAVANTAGE: 600000, // 10 minutos
} as const;

const SENTIMENT_KEYWORDS = {
  positive: ['sube', 'gana', 'crece', 'récord', 'alcista', 'compra', 'bullish', 'rally', 'boom', 'éxito', 'ganancias', 'aprueban', 'acuerdo'],
  negative: ['baja', 'pierde', 'caída', 'crisis', 'bajista', 'vende', 'bearish', 'crash', 'pánico', 'fracaso', 'pérdidas', 'rechazo', 'conflicto'],
} as const;

// ==================== CACHE MANAGER ====================

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 60000; // 1 minuto

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = CacheManager.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ==================== COINGECKO SERVICE ====================

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  private buildPriceUrl(coinIds: string[]): string {
    const params = new URLSearchParams({
      ids: coinIds.join(','),
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_24hr_change: 'true',
      include_7d_change: 'true',
      include_30d_change: 'true',
      sparkline: 'true',
    });

    return `${this.baseUrl}/simple/price?${params}`;
  }

  private formatCoinPrice(coinId: string, coinData: any): CoinPrice {
    return {
      id: coinId,
      symbol: coinId.toLowerCase(),
      name: coinId,
      price: coinData.usd || 0,
      marketCap: coinData.usd_market_cap || 0,
      volume24h: coinData.usd_24h_vol || 0,
      priceChangePercentage24h: coinData.usd_24h_change || 0,
      priceChangePercentage7d: coinData.usd_7d_change || 0,
      priceChangePercentage30d: coinData.usd_30d_change || 0,
      sparkline: coinData.sparkline_in_7d?.price || [],
      lastUpdated: Date.now(),
    };
  }

  async getCoinPrice(coinId: string): Promise<CoinPrice> {
    const cacheKey = `coingecko:price:${coinId}`;
    // Intentar caché vigente primero
    const cached = this.cache.get<CoinPrice>(cacheKey);
    if (cached) return cached;

    // Caché expirado pero existente (stale) — lo devolvemos si la API falla
    const staleKey = `coingecko:price:stale:${coinId}`;
    const stale = this.cache.get<CoinPrice>(staleKey);

    try {
      const url = this.buildPriceUrl([coinId]);
      const response = await fetch(url);

      if (response.status === 429) {
        console.warn(`CoinGecko rate limit (429) for ${coinId} — returning stale data`);
        if (stale) return stale;
        throw new Error('CoinGecko rate limit exceeded');
      }

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      if (!data[coinId]) throw new Error(`Coin ${coinId} not found`);

      const result = this.formatCoinPrice(coinId, data[coinId]);
      // Caché principal: 30 s (seguro para plan gratuito ~30 req/min)
      this.cache.set(cacheKey, result, 30_000);
      // Caché stale: 5 min (fallback si hay rate limit)
      this.cache.set(staleKey, result, 300_000);
      return result;
    } catch (error) {
      if (stale) {
        console.warn(`CoinGecko error for ${coinId}, using stale cache`);
        return stale;
      }
      console.error('Error fetching from CoinGecko:', error);
      throw error;
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinPrice[]> {
    try {
      const url = this.buildPriceUrl(coinIds);
      const response = await fetch(url);

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const results: CoinPrice[] = coinIds
        .filter(coinId => data[coinId])
        .map(coinId => this.formatCoinPrice(coinId, data[coinId]));

      return results;
    } catch (error) {
      console.error('Error fetching multiple coins from CoinGecko:', error);
      throw error;
    }
  }

  async getTrendingCoins(): Promise<Coin[]> {
    const cacheKey = 'coingecko:trending';
    const cached = this.cache.get<Coin[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/search/trending`);

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const results: Coin[] = data.coins.slice(0, 10).map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        image: item.item.image || '',
        currentPrice: item.item.price_btc || 0,
        marketCap: item.item.market_cap_rank || 0,
        marketCapRank: item.item.market_cap_rank || 0,
        volume24h: 0,
        priceChangePercentage24h: 0,
      }));

      this.cache.set(cacheKey, results, 300000);
      return results;
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw error;
    }
  }

  async getCoinHistory(coinId: string, days: number = 30, interval: string = '1d'): Promise<OHLCV[]> {
    const cacheKey = `coingecko:history:${coinId}:${days}:${interval}`;
    const cached = this.cache.get<OHLCV[]>(cacheKey);
    if (cached) return cached;

    const staleKey = `coingecko:history:stale:${coinId}:${days}:${interval}`;
    const stale = this.cache.get<OHLCV[]>(staleKey);

    const ttlMap: Record<string, number> = {
      '1m': 60_000, '5m': 60_000, '15m': 120_000,
      '1h': 180_000, '4h': 300_000,
      '1d': 600_000, '1w': 900_000,
    };
    const cacheTtl = ttlMap[interval] ?? 180_000;

    /** Fetch con manejo de 429 */
    const safeFetch = async (url: string): Promise<Response> => {
      const res = await fetch(url);
      if (res.status === 429) {
        console.warn(`CoinGecko 429 on ${url}`);
        if (stale) throw Object.assign(new Error('rate_limit'), { isRateLimit: true });
        // Esperar 10 s y reintentar una vez
        await new Promise(r => setTimeout(r, 10_000));
        const retry = await fetch(url);
        if (retry.status === 429) throw Object.assign(new Error('rate_limit'), { isRateLimit: true });
        return retry;
      }
      return res;
    };

    // ── Intervalos ≥ 1h → endpoint /ohlc que devuelve OHLC reales ───────────
    // El endpoint /ohlc de CoinGecko devuelve [timestamp, open, high, low, close]
    // con granularidad fija según days:
    //   days=1  → velas de 30 min
    //   days=7  → velas de 4 h
    //   days≤30 → velas de 4 h
    //   days≤90 → velas de 4 h  (usamos 90 para 4h)
    //   days≤365→ velas de 4 h o 1 día según la moneda
    if (['1h', '4h', '1d', '1w'].includes(interval)) {
      const ohlcDaysMap: Record<string, number> = {
        '1h':  1,
        '4h':  7,
        '1d':  30,
        '1w':  180,
      };
      const ohlcDays = ohlcDaysMap[interval] ?? 7;

      try {
        const ohlcUrl = `${this.baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${ohlcDays}`;
        const ohlcResp = await safeFetch(ohlcUrl);
        if (!ohlcResp.ok) throw new Error(`CoinGecko OHLC error ${ohlcResp.status}`);
        const ohlcRaw: number[][] = await ohlcResp.json();
        if (!Array.isArray(ohlcRaw) || ohlcRaw.length === 0) throw new Error('Empty OHLC');

        // Volúmenes via market_chart (silenciamos errores de rate limit aquí)
        const volMap = new Map<number, number>();
        try {
          const chartUrl = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${ohlcDays}`;
          const chartResp = await safeFetch(chartUrl);
          if (chartResp.ok) {
            const chartData = await chartResp.json();
            const vBucket = 60 * 60_000;
            (chartData.total_volumes ?? []).forEach(([ts, vol]: [number, number]) => {
              const b = Math.floor(ts / vBucket) * vBucket;
              volMap.set(b, (volMap.get(b) ?? 0) + vol);
            });
          }
        } catch { /* volumen no crítico */ }

        const needAgg = interval === '1h' || interval === '1d' || interval === '1w';

        let result: OHLCV[];
        if (!needAgg) {
          result = ohlcRaw.map(([ts, o, h, l, c]) => {
            const b = Math.floor(ts / (60 * 60_000)) * (60 * 60_000);
            return { time: ts, open: o, high: h, low: l, close: c, volume: volMap.get(b) ?? 0 };
          });
        } else {
          type C = { open: number; high: number; low: number; close: number; vol: number; ts: number };
          const aggMs: Record<string, number> = {
            '1h': 60 * 60_000,
            '1d': 24 * 60 * 60_000,
            '1w': 7 * 24 * 60 * 60_000,
          };
          const bMs = aggMs[interval];
          const map = new Map<number, C>();
          ohlcRaw.forEach(([ts, o, h, l, c]) => {
            const b  = Math.floor(ts / bMs) * bMs;
            const vb = Math.floor(ts / (60 * 60_000)) * (60 * 60_000);
            const ex = map.get(b);
            if (!ex) {
              map.set(b, { open: o, high: h, low: l, close: c, vol: volMap.get(vb) ?? 0, ts: b });
            } else {
              if (h > ex.high) ex.high = h;
              if (l < ex.low)  ex.low  = l;
              ex.close = c;
              ex.vol  += volMap.get(vb) ?? 0;
            }
          });
          result = Array.from(map.values())
            .sort((a, b) => a.ts - b.ts)
            .map(c => ({ time: c.ts, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.vol }));
        }

        this.cache.set(cacheKey, result, cacheTtl);
        this.cache.set(staleKey, result, 3_600_000); // stale 1h
        return result;
      } catch (err: any) {
        if (err?.isRateLimit && stale) {
          console.warn(`Rate limit on OHLC for ${coinId} — returning stale`);
          return stale;
        }
        console.error('CoinGecko OHLC failed, falling back to market_chart:', err);
        if (stale) return stale;
        // cae al bloque intraday abajo
      }
    }

    // ── Intraday (1m, 5m, 15m) ────────────────────────────────────────────────
    const bucketMsMap: Record<string, number> = {
      '1m':  60_000,
      '5m':  5 * 60_000,
      '15m': 15 * 60_000,
    };
    const bucketMs = bucketMsMap[interval] ?? 60_000;

    try {
      const chartUrl = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
      const response = await safeFetch(chartUrl);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const prices: [number, number][] = data.prices ?? [];
      const volumes: [number, number][] = data.total_volumes ?? [];
      if (prices.length === 0) throw new Error('No price data');

      const volumeMap = new Map<number, number>();
      volumes.forEach(([ts, vol]) => {
        const b = Math.floor(ts / bucketMs) * bucketMs;
        volumeMap.set(b, (volumeMap.get(b) ?? 0) + vol);
      });

      type Candle = { open: number; high: number; low: number; close: number; volume: number; ts: number };
      const candleMap = new Map<number, Candle>();
      prices.forEach(([ts, price]) => {
        const b = Math.floor(ts / bucketMs) * bucketMs;
        const ex = candleMap.get(b);
        if (!ex) {
          candleMap.set(b, { open: price, high: price, low: price, close: price, volume: 0, ts: b });
        } else {
          if (price > ex.high) ex.high = price;
          if (price < ex.low)  ex.low  = price;
          ex.close = price;
        }
      });
      candleMap.forEach((c, b) => { c.volume = volumeMap.get(b) ?? 0; });

      const result: OHLCV[] = Array.from(candleMap.values())
        .sort((a, b) => a.ts - b.ts)
        .map(c => ({ time: c.ts, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));

      this.cache.set(cacheKey, result, cacheTtl);
      this.cache.set(staleKey, result, 3_600_000);
      return result;
    } catch (err: any) {
      if (stale) {
        console.warn(`CoinGecko error for ${coinId} intraday, using stale`);
        return stale;
      }
      throw err;
    }
  }
}

// ==================== FINNHUB SERVICE ====================

class FinnhubService {
  private baseUrl = 'https://finnhub.io/api/v1';
  private apiKey: string;
  private cache: CacheManager;
  private wsConnections = new Map<string, WebSocket>();
  private readonly resolutionMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
  };

  constructor(apiKey: string, cache: CacheManager) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  private mapResolution(timeframe: string): string {
    return this.resolutionMap[timeframe] || '60';
  }

  private handleApiError(status: number): void {
    if (status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`Finnhub API error: ${status}`);
  }

  private formatStockQuote(symbol: string, data: any): StockQuote {
    return {
      symbol,
      price: data.c || 0,
      change: data.d || 0,
      changePercent: data.dp || 0,
      timestamp: Date.now(),
      bid: data.bp,
      ask: data.ap,
      bidSize: data.bv,
      askSize: data.av,
    };
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `finnhub:quote:${symbol}`;
    const cached = this.cache.get<StockQuote>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) this.handleApiError(response.status);

      const data = await response.json();
      const result = this.formatStockQuote(symbol, data);

      this.cache.set(cacheKey, result, 10_000); // 10 s — sincronizado con polling
      return result;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw error;
    }
  }

  async getStockCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<CandleData[]> {
    const cacheKey = `finnhub:candles:${symbol}:${resolution}:${from}:${to}`;
    const cached = this.cache.get<CandleData[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) this.handleApiError(response.status);

      const data = await response.json();

      if (!data.o || !Array.isArray(data.o)) {
        return [];
      }

      const result: CandleData[] = data.o.map((open: number, index: number) => ({
        time: (data.t?.[index] || Date.now() / 1000) * 1000,
        open,
        high: data.h?.[index] || open,
        low: data.l?.[index] || open,
        close: data.c?.[index] || open,
        volume: data.v?.[index] || 0,
      }));

      this.cache.set(cacheKey, result, 300000);
      return result;
    } catch (error) {
      console.error('Error fetching stock candles:', error);
      throw error;
    }
  }

  subscribeToStock(
    symbol: string,
    callback: (data: StockQuote) => void
  ): () => void {
    const wsUrl = `wss://ws.finnhub.io?token=${this.apiKey}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'trade' && message.data) {
            const trade = message.data[0];
            callback({
              symbol,
              price: trade.p,
              change: 0,
              changePercent: 0,
              timestamp: trade.t,
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        this.wsConnections.delete(symbol);
      };

      this.wsConnections.set(symbol, ws);

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        }
        ws.close();
        this.wsConnections.delete(symbol);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      return () => {};
    }
  }
}

// ==================== NEWSAPI SERVICE ====================

class NewsAPIService {
  private baseUrl = 'https://newsapi.org/v2';
  private apiKey: string;
  private cache: CacheManager;

  constructor(apiKey: string, cache: CacheManager) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    const positiveCount = SENTIMENT_KEYWORDS.positive.filter(word => lowerText.includes(word)).length;
    const negativeCount = SENTIMENT_KEYWORDS.negative.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private formatArticle(article: any): NewsArticle {
    const text = article.title + ' ' + (article.description || '');
    return {
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      image: article.urlToImage,
      source: article.source.name,
      url: article.url,
      publishedAt: new Date(article.publishedAt).getTime(),
      sentiment: this.analyzeSentiment(text),
    };
  }

  async getNews(query: string, limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `newsapi:${query}:${limit}`;
    const cached = this.cache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=es&pageSize=${limit}&apiKey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();
      const results: NewsArticle[] = (data.articles || []).map(this.formatArticle.bind(this));

      this.cache.set(cacheKey, results, 300000);
      return results;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  async getHeadlines(category: string = 'business', limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `newsapi:headlines:${category}:${limit}`;
    const cached = this.cache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${this.baseUrl}/top-headlines?category=${category}&language=es&pageSize=${limit}&apiKey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);

      const data = await response.json();
      const results: NewsArticle[] = (data.articles || []).map(this.formatArticle.bind(this));

      this.cache.set(cacheKey, results, 300000);
      return results;
    } catch (error) {
      console.error('Error fetching headlines:', error);
      throw error;
    }
  }
}

// ==================== ALPHA VANTAGE SERVICE ====================

class AlphaVantageService {
  private baseUrl = 'https://www.alphavantage.co/query';
  private apiKey: string;
  private cache: CacheManager;

  constructor(apiKey: string, cache: CacheManager) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  private buildParams(params: Record<string, string>): URLSearchParams {
    return new URLSearchParams(params);
  }

  private buildUrl(params: Record<string, string>): string {
    const searchParams = this.buildParams(params);
    return `${this.baseUrl}?${searchParams}`;
  }

  async getCandles(
    symbol: string,
    interval: string = '60min',
    limit: number = 100
  ): Promise<CandleData[]> {
    const cacheKey = `alphavantage:candles:${symbol}:${interval}`;
    const cached = this.cache.get<CandleData[]>(cacheKey);
    if (cached) return cached;

    try {
      const functionName = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
      const params: Record<string, string> = {
        function: functionName,
        symbol,
        apikey: this.apiKey,
      };

      if (interval !== 'daily') {
        params.interval = interval;
      }

      const url = this.buildUrl(params);
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Alpha Vantage API error: ${response.status}`);

      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      const timeSeriesKey = Object.keys(data).find(key => key.startsWith('Time Series'));
      if (!timeSeriesKey) {
        throw new Error('No time series data found');
      }

      const timeSeries = data[timeSeriesKey];
      const result: CandleData[] = Object.entries(timeSeries)
        .slice(0, limit)
        .map(([timestamp, values]: [string, any]) => ({
          time: new Date(timestamp).getTime(),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        }));

      this.cache.set(cacheKey, result, 600000);
      return result;
    } catch (error) {
      console.error('Error fetching from Alpha Vantage:', error);
      throw error;
    }
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval: string = '60min',
    timePeriod: number = 20
  ): Promise<Record<string, number>> {
    const cacheKey = `alphavantage:indicator:${symbol}:${indicator}:${timePeriod}`;
    const cached = this.cache.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    try {
      const params: Record<string, string> = {
        function: indicator,
        symbol,
        interval,
        time_period: timePeriod.toString(),
        apikey: this.apiKey,
      };

      const url = this.buildUrl(params);
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Alpha Vantage API error: ${response.status}`);

      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      const indicatorKey = Object.keys(data).find(key => key.startsWith('Technical Analysis'));
      if (!indicatorKey) {
        throw new Error('No indicator data found');
      }

      const result = data[indicatorKey];
      this.cache.set(cacheKey, result, 600000);
      return result;
    } catch (error) {
      console.error('Error fetching technical indicator:', error);
      throw error;
    }
  }
}

// ==================== YAHOO FINANCE SERVICE ====================
// Sin API key — usa el endpoint público v8 de Yahoo Finance.
// Soporta stocks, índices (^GSPC, ^DJI…), forex (EURUSD=X), commodities (GC=F).

class YahooFinanceService {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  /** Convierte nuestro símbolo interno al ticker de Yahoo */
  private toYahooTicker(symbol: string): string {
    const map: Record<string, string> = {
      // Índices
      'SPX': '^GSPC', 'INDU': '^DJI', 'CCMP': '^IXIC', 'VIX': '^VIX',
      // Forex  (Yahoo usa el sufijo =X)
      'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'JPYUSD': 'JPYUSD=X',
      'CHFUSD': 'CHFUSD=X', 'AUDUSD': 'AUDUSD=X', 'CADMXN': 'CADMXN=X',
      // Commodities (futuros continuos de Yahoo)
      'XAUUSD': 'GC=F', 'XAGUSD': 'SI=F', 'XPTUSD': 'PL=F',
      'XPDUSD': 'PA=F', 'CRUDE': 'CL=F', 'NATGAS': 'NG=F', 'COPPER': 'HG=F',
    };
    return map[symbol] ?? symbol; // stocks (AAPL, GOOGL…) coinciden tal cual
  }

  /** Mapea nuestro TimeFrame al intervalo y rango de Yahoo Finance v8 */
  private toYahooParams(interval: TimeFrame, days: number): { yahooInterval: string; range: string } {
    const map: Record<TimeFrame, { yahooInterval: string; range: string }> = {
      '1m':  { yahooInterval: '1m',  range: '1d'  },
      '5m':  { yahooInterval: '5m',  range: '5d'  },
      '15m': { yahooInterval: '15m', range: '5d'  },
      '1h':  { yahooInterval: '60m', range: '7d'  },
      '4h':  { yahooInterval: '60m', range: '30d' }, // Yahoo no tiene 4h, agrupamos 1h→4h
      '1d':  { yahooInterval: '1d',  range: '3mo' },
      '1w':  { yahooInterval: '1wk', range: '2y'  },
    };
    return map[interval] ?? { yahooInterval: '1d', range: '3mo' };
  }

  /** Agrupa velas de 1h en velas de 4h */
  private aggregate4h(candles: CandleData[]): CandleData[] {
    if (candles.length === 0) return [];
    const bucketMs = 4 * 60 * 60_000;
    type C = { open: number; high: number; low: number; close: number; volume: number; ts: number };
    const map = new Map<number, C>();

    candles.forEach(c => {
      const bucket = Math.floor(c.time / bucketMs) * bucketMs;
      const ex = map.get(bucket);
      if (!ex) {
        map.set(bucket, { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume, ts: bucket });
      } else {
        if (c.high > ex.high) ex.high = c.high;
        if (c.low  < ex.low)  ex.low  = c.low;
        ex.close   = c.close;
        ex.volume += c.volume;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => a.ts - b.ts)
      .map(c => ({ time: c.ts, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));
  }

  async getHistory(symbol: string, interval: TimeFrame, days: number): Promise<CandleData[]> {
    const cacheKey = `yahoo:${symbol}:${interval}`;
    const cached = this.cache.get<CandleData[]>(cacheKey);
    if (cached) return cached;

    const ticker = this.toYahooTicker(symbol);
    const { yahooInterval, range } = this.toYahooParams(interval, days);

    // Yahoo Finance v8 — endpoint público (no requiere API key)
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?interval=${yahooInterval}&range=${range}&includePrePost=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance error ${response.status} para ${symbol} (${ticker})`);
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error(`Sin datos en Yahoo Finance para ${symbol}`);

    const timestamps: number[]  = result.timestamp ?? [];
    const quote                  = result.indicators?.quote?.[0] ?? {};
    const opens: number[]        = quote.open   ?? [];
    const highs: number[]        = quote.high   ?? [];
    const lows: number[]         = quote.low    ?? [];
    const closes: number[]       = quote.close  ?? [];
    const volumes: number[]      = quote.volume ?? [];

    const candles: CandleData[] = timestamps
      .map((ts, i) => ({
        time:   ts * 1000,          // Yahoo devuelve segundos → ms
        open:   opens[i]   ?? closes[i] ?? 0,
        high:   highs[i]   ?? closes[i] ?? 0,
        low:    lows[i]    ?? closes[i] ?? 0,
        close:  closes[i]  ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter(c => c.close > 0);   // descartar velas vacías (pre/post market, festivos)

    const finalCandles = interval === '4h' ? this.aggregate4h(candles) : candles;

    // TTL según intervalo
    const ttl: Record<TimeFrame, number> = {
      '1m': 30_000, '5m': 30_000, '15m': 60_000,
      '1h': 120_000, '4h': 120_000,
      '1d': 300_000, '1w': 600_000,
    };
    this.cache.set(cacheKey, finalCandles, ttl[interval] ?? 120_000);
    return finalCandles;
  }

  /** Precio actual via Yahoo — útil para activos no soportados por Finnhub gratis */
  async getPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
    const cacheKey = `yahoo:price:${symbol}`;
    const cached = this.cache.get<{ price: number; change: number; changePercent: number }>(cacheKey);
    if (cached) return cached;

    const ticker = this.toYahooTicker(symbol);
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
      `?interval=1d&range=5d&includePrePost=false`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`Yahoo Finance price error ${response.status}`);

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    const meta   = result?.meta ?? {};

    const price         = meta.regularMarketPrice ?? 0;
    const prevClose     = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change        = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    const out = { price, change, changePercent };
    this.cache.set(cacheKey, out, 10_000);
    return out;
  }
}

// ==================== MARKET SERVICE (MAIN) ====================

export class MarketService {
  private cache: CacheManager;
  private coingecko: CoinGeckoService;
  private finnhub: FinnhubService;
  private newsapi: NewsAPIService;
  private alphavantage: AlphaVantageService;
  private yahoo: YahooFinanceService;

  constructor(
    finnhubKey: string = process.env.NEXT_PUBLIC_FINNHUB_KEY || '',
    newsapiKey: string = process.env.NEXT_PUBLIC_NEWSAPI_KEY || '',
    alphavantageKey: string = process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY || ''
  ) {
    this.cache = new CacheManager();
    this.coingecko   = new CoinGeckoService(this.cache);
    this.finnhub     = new FinnhubService(finnhubKey, this.cache);
    this.newsapi     = new NewsAPIService(newsapiKey, this.cache);
    this.alphavantage = new AlphaVantageService(alphavantageKey, this.cache);
    this.yahoo       = new YahooFinanceService(this.cache);
  }

  // ========== CRIPTOMONEDAS ==========

  /**
   * Obtiene el precio actual de una criptomoneda
   * @param coinId - ID de la moneda (ej: bitcoin, ethereum)
   */
  async getCoinPrice(coinId: string): Promise<CoinPrice> {
    return this.coingecko.getCoinPrice(coinId);
  }

  /**
   * Obtiene precios de múltiples criptomonedas
   * @param coinIds - Array de IDs de monedas
   */
  async getCoinPrices(coinIds: string[]): Promise<CoinPrice[]> {
    return this.coingecko.getCoinPrices(coinIds);
  }

  /**
   * Obtiene las criptomonedas en tendencia
   */
  async getTrendingCoins(): Promise<Coin[]> {
    return this.coingecko.getTrendingCoins();
  }

  /**
   * Obtiene el historial de precios de una criptomoneda
   * @param coinId - ID de la moneda
   * @param days - Número de días a recuperar (default: 30)
   * @param interval - Intervalo de vela (default: 1d)
   */
  async getCoinHistory(coinId: string, days?: number, interval?: string): Promise<OHLCV[]> {
    return this.coingecko.getCoinHistory(coinId, days, interval);
  }

  // ========== ACCIONES ==========

  /**
   * Obtiene la cotización actual de una acción
   * @param symbol - Símbolo de la acción (ej: AAPL, MSFT)
   */
  async getStockQuote(symbol: string): Promise<StockQuote> {
    return this.finnhub.getStockQuote(symbol);
  }

  /**
   * Obtiene datos de velas (candlesticks) de una acción
   * @param symbol - Símbolo de la acción
   * @param resolution - Resolución temporal (1, 5, 15, 60, D, W)
   * @param from - Timestamp inicial (segundos)
   * @param to - Timestamp final (segundos)
   */
  async getStockCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<CandleData[]> {
    return this.finnhub.getStockCandles(symbol, resolution, from, to);
  }

  /**
   * Obtiene datos históricos para stocks, índices, forex y commodities.
   * Usa Yahoo Finance (sin API key) como fuente principal — Finnhub plan
   * gratuito da 403 en el endpoint /stock/candle.
   */
  async getStockHistory(symbol: string, interval: TimeFrame, days: number): Promise<CandleData[]> {
    return this.yahoo.getHistory(symbol, interval, days);
  }

  /**
   * Obtiene precio actual desde Yahoo Finance (stocks, índices, forex, commodities).
   */
  async getYahooPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
    return this.yahoo.getPrice(symbol);
  }

  /**
   * Se suscribe a actualizaciones en tiempo real de una acción
   * @param symbol - Símbolo de la acción
   * @param callback - Función a llamar cuando llegan datos
   * @returns Función para desuscribirse
   */
  subscribeToStock(symbol: string, callback: (data: StockQuote) => void): () => void {
    return this.finnhub.subscribeToStock(symbol, callback);
  }

  // ========== NOTICIAS ==========

  /**
   * Busca noticias por término de búsqueda
   * @param query - Término a buscar
   * @param limit - Número máximo de artículos (default: 10)
   */
  async getNews(query: string, limit?: number): Promise<NewsArticle[]> {
    return this.newsapi.getNews(query, limit);
  }

  /**
   * Obtiene noticias destacadas por categoría
   * @param category - Categoría (ej: business, technology) (default: business)
   * @param limit - Número máximo de artículos (default: 10)
   */
  async getHeadlines(category?: string, limit?: number): Promise<NewsArticle[]> {
    return this.newsapi.getHeadlines(category, limit);
  }

  // ========== DATOS HISTÓRICOS E INDICADORES ==========

  /**
   * Obtiene datos históricos de velas
   * @param symbol - Símbolo del activo
   * @param interval - Intervalo temporal (default: 60min)
   * @param limit - Número máximo de velas (default: 100)
   */
  async getCandles(
    symbol: string,
    interval?: string,
    limit?: number
  ): Promise<CandleData[]> {
    return this.alphavantage.getCandles(symbol, interval, limit);
  }

  /**
   * Obtiene un indicador técnico
   * @param symbol - Símbolo del activo
   * @param indicator - Nombre del indicador (SMA, EMA, RSI, etc)
   * @param interval - Intervalo temporal (default: 60min)
   * @param timePeriod - Período de tiempo (default: 20)
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval?: string,
    timePeriod?: number
  ): Promise<Record<string, number>> {
    return this.alphavantage.getTechnicalIndicator(symbol, indicator, interval, timePeriod);
  }

  // ========== CACHE MANAGEMENT ==========

  /**
   * Obtiene datos cacheados
   * @param key - Clave del caché
   */
  getCachedData<T>(key: string): T | null {
    return this.cache.get<T>(key);
  }

  /**
   * Establece datos en caché
   * @param key - Clave del caché
   * @param data - Datos a cachear
   * @param ttl - Tiempo de vida en milisegundos (default: 60000)
   */
  setCachedData<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, data, ttl);
  }

  /**
   * Limpia todo el caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Elimina una entrada del caché
   * @param key - Clave a eliminar
   */
  deleteCachedData(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getStats();
  }
}

// ========== SINGLETON INSTANCE ==========
export const marketService = new MarketService(
  process.env.NEXT_PUBLIC_FINNHUB_KEY,
  process.env.NEXT_PUBLIC_NEWSAPI_KEY,
  process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY
);

export default marketService;

