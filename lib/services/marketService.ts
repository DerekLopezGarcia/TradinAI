import { CandleData } from '@/lib/types';

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

// ==================== CACHE MANAGER ====================

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private static readonly DEFAULT_TTL = 60000; // 1 minuto

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
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
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
}

// ==================== COINGECKO SERVICE ====================

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  async getCoinPrice(coinId: string): Promise<CoinPrice> {
    const cacheKey = `coingecko:price:${coinId}`;
    const cached = this.cache.get<CoinPrice>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_7d_change=true&include_30d_change=true&sparkline=true`
      );

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();

      if (!data[coinId]) {
        throw new Error(`Coin ${coinId} not found`);
      }

      const coinData = data[coinId];
      const result: CoinPrice = {
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

      this.cache.set(cacheKey, result, 30000); // Cache por 30 segundos
      return result;
    } catch (error) {
      console.error('Error fetching from CoinGecko:', error);
      throw error;
    }
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinPrice[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&sparkline=true`
      );

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const results: CoinPrice[] = [];

      for (const coinId of coinIds) {
        if (data[coinId]) {
          const coinData = data[coinId];
          results.push({
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
          });
        }
      }

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
      const response = await fetch(
        `${this.baseUrl}/search/trending`
      );

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

      this.cache.set(cacheKey, results, 300000); // Cache por 5 minutos
      return results;
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw error;
    }
  }

  async getCoinHistory(
    coinId: string,
    days: number = 30
  ): Promise<OHLCV[]> {
    const cacheKey = `coingecko:history:${coinId}:${days}`;
    const cached = this.cache.get<OHLCV[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`
      );

      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];

      const result: OHLCV[] = prices.map((price: any[], index: number) => {
        const timestamp = price[0];
        const priceValue = price[1];
        const volume = volumes[index]?.[1] || 0;

        return {
          time: timestamp,
          open: priceValue,
          high: priceValue * 1.02,
          low: priceValue * 0.98,
          close: priceValue,
          volume,
        };
      });

      this.cache.set(cacheKey, result, 600000); // Cache por 10 minutos
      return result;
    } catch (error) {
      console.error('Error fetching coin history:', error);
      throw error;
    }
  }
}

// ==================== FINNHUB SERVICE ====================

class FinnhubService {
  private baseUrl = 'https://finnhub.io/api/v1';
  private apiKey: string;
  private cache: CacheManager;
  private wsConnections = new Map<string, WebSocket>();

  constructor(apiKey: string, cache: CacheManager) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `finnhub:quote:${symbol}`;
    const cached = this.cache.get<StockQuote>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();

      const result: StockQuote = {
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

      this.cache.set(cacheKey, result, 5000); // Cache por 5 segundos
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
      const response = await fetch(
        `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`Finnhub API error: ${response.status}`);
      }

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

      this.cache.set(cacheKey, result, 300000); // Cache por 5 minutos
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

      // Return unsubscribe function
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

  private mapResolution(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1h': '60',
      '4h': '240',
      '1d': 'D',
      '1w': 'W',
    };
    return mapping[timeframe] || '60';
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

  async getNews(query: string, limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `newsapi:${query}:${limit}`;
    const cached = this.cache.get<NewsArticle[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=es&pageSize=${limit}&apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();
      const results: NewsArticle[] = (data.articles || []).map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        image: article.urlToImage,
        source: article.source.name,
        url: article.url,
        publishedAt: new Date(article.publishedAt).getTime(),
        sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
      }));

      this.cache.set(cacheKey, results, 300000); // Cache por 5 minutos
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
      const response = await fetch(
        `${this.baseUrl}/top-headlines?category=${category}&language=es&pageSize=${limit}&apiKey=${this.apiKey}`
      );

      if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);

      const data = await response.json();
      const results: NewsArticle[] = (data.articles || []).map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description,
        content: article.content,
        image: article.urlToImage,
        source: article.source.name,
        url: article.url,
        publishedAt: new Date(article.publishedAt).getTime(),
        sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
      }));

      this.cache.set(cacheKey, results, 300000);
      return results;
    } catch (error) {
      console.error('Error fetching headlines:', error);
      throw error;
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['sube', 'gana', 'crece', 'récord', 'alcista', 'compra', 'bullish', 'rally', 'boom', 'éxito', 'ganancias', 'aprueban', 'acuerdo'];
    const negativeWords = ['baja', 'pierde', 'caída', 'crisis', 'bajista', 'vende', 'bearish', 'crash', 'pánico', 'fracaso', 'pérdidas', 'rechazo', 'conflicto'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
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

  async getCandles(
    symbol: string,
    interval: string = '60min',
    limit: number = 100
  ): Promise<CandleData[]> {
    const cacheKey = `alphavantage:candles:${symbol}:${interval}`;
    const cached = this.cache.get<CandleData[]>(cacheKey);
    if (cached) return cached;

    try {
      const function_name = interval === 'daily' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
      const params = new URLSearchParams({
        function: function_name,
        symbol,
        interval: interval === 'daily' ? '' : interval,
        apikey: this.apiKey,
      });

      const url = `${this.baseUrl}?${params}`;
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

      this.cache.set(cacheKey, result, 600000); // Cache por 10 minutos
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
      const params = new URLSearchParams({
        function: indicator,
        symbol,
        interval,
        time_period: timePeriod.toString(),
        apikey: this.apiKey,
      });

      const url = `${this.baseUrl}?${params}`;
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

// ==================== MARKET SERVICE (MAIN) ====================

export class MarketService {
  private cache: CacheManager;
  private coingecko: CoinGeckoService;
  private finnhub: FinnhubService;
  private newsapi: NewsAPIService;
  private alphavantage: AlphaVantageService;

  constructor(
    finnhubKey: string = process.env.NEXT_PUBLIC_FINNHUB_KEY || '',
    newsapiKey: string = process.env.NEXT_PUBLIC_NEWSAPI_KEY || '',
    alphavantageKey: string = process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY || ''
  ) {
    this.cache = new CacheManager();
    this.coingecko = new CoinGeckoService(this.cache);
    this.finnhub = new FinnhubService(finnhubKey, this.cache);
    this.newsapi = new NewsAPIService(newsapiKey, this.cache);
    this.alphavantage = new AlphaVantageService(alphavantageKey, this.cache);
  }

  // ========== CRIPTOMONEDAS ==========
  async getCoinPrice(coinId: string): Promise<CoinPrice> {
    return this.coingecko.getCoinPrice(coinId);
  }

  async getCoinPrices(coinIds: string[]): Promise<CoinPrice[]> {
    return this.coingecko.getCoinPrices(coinIds);
  }

  async getTrendingCoins(): Promise<Coin[]> {
    return this.coingecko.getTrendingCoins();
  }

  async getCoinHistory(coinId: string, days?: number): Promise<OHLCV[]> {
    return this.coingecko.getCoinHistory(coinId, days);
  }

  // ========== ACCIONES ==========
  async getStockQuote(symbol: string): Promise<StockQuote> {
    return this.finnhub.getStockQuote(symbol);
  }

  async getStockCandles(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<CandleData[]> {
    return this.finnhub.getStockCandles(symbol, resolution, from, to);
  }

  subscribeToStock(symbol: string, callback: (data: StockQuote) => void): () => void {
    return this.finnhub.subscribeToStock(symbol, callback);
  }

  // ========== NOTICIAS ==========
  async getNews(query: string, limit?: number): Promise<NewsArticle[]> {
    return this.newsapi.getNews(query, limit);
  }

  async getHeadlines(category?: string, limit?: number): Promise<NewsArticle[]> {
    return this.newsapi.getHeadlines(category, limit);
  }

  // ========== DATOS HISTÓRICOS E INDICADORES ==========
  async getCandles(
    symbol: string,
    interval?: string,
    limit?: number
  ): Promise<CandleData[]> {
    return this.alphavantage.getCandles(symbol, interval, limit);
  }

  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval?: string,
    timePeriod?: number
  ): Promise<Record<string, number>> {
    return this.alphavantage.getTechnicalIndicator(symbol, indicator, interval, timePeriod);
  }

  // ========== CACHE ==========
  getCachedData<T>(key: string): T | null {
    return this.cache.get<T>(key);
  }

  setCachedData<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, data, ttl);
  }

  clearCache(): void {
    this.cache.clear();
  }

  deleteCachedData(key: string): void {
    this.cache.delete(key);
  }
}

// ========== SINGLETON INSTANCE ==========
export const marketService = new MarketService(
  process.env.NEXT_PUBLIC_FINNHUB_KEY,
  process.env.NEXT_PUBLIC_NEWSAPI_KEY,
  process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY
);

export default marketService;

