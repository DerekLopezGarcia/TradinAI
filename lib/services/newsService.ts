import { NewsItem, Sentiment } from '@/lib/types';
import { YahooFinanceNewsProvider } from './yahooFinanceNewsProvider';
import { AlphaVantageNewsProvider } from './alphaVantageNewsProvider';
import { newsSentimentService } from './newsSentimentService';

class NewsService {
  private finnhubApiKey: string;
  private newsApiKey: string;
  private cache = new Map<string, { data: NewsItem[]; timestamp: number }>();
  private readonly CACHE_TTL = 300000;
  private readonly MAX_RESULTS = 25;

  private yahooFinanceProvider: YahooFinanceNewsProvider;
  private alphaVantageProvider: AlphaVantageNewsProvider;

  constructor() {
    this.finnhubApiKey = process.env.FINNHUB_KEY || '';
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.yahooFinanceProvider = new YahooFinanceNewsProvider();
    this.alphaVantageProvider = new AlphaVantageNewsProvider();
  }

  private analyzeSentiment(text: string): { sentiment: Sentiment; sentimentScore: number; sentimentConfidence: number; sentimentStrength: 'strong' | 'moderate' | 'weak' } {
    const result = newsSentimentService.analyzeSentiment(text);
    return {
      sentiment: result.sentiment,
      sentimentScore: result.score,
      sentimentConfidence: result.confidence,
      sentimentStrength: result.strength,
    };
  }

  private getFromCache(key: string): NewsItem[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) { this.cache.delete(key); return null; }
    return cached.data;
  }

  private setCache(key: string, data: NewsItem[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private formatDate(date: string | number | Date): string {
    if (typeof date === 'number') {
      return new Date(date * 1000).toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  }

  private async fetchFinnhubNews(symbol: string, days: number): Promise<NewsItem[]> {
    if (!this.finnhubApiKey) return [];

    try {
      const from = new Date();
      from.setDate(from.getDate() - days);
      const to = new Date();
      const fromDate = this.formatDate(from);
      const toDate = this.formatDate(to);
      const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${this.finnhubApiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Finnhub API error: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            title: item.headline || 'Sin título',
            description: item.summary || '',
            source: item.source || 'Finnhub',
            url: item.url || '',
            timestamp: (item.datetime || Math.floor(Date.now() / 1000)) * 1000,
            ...this.analyzeSentiment((item.headline || '') + ' ' + (item.summary || '')),
            relevantAssets: [symbol],
            imageUrl: item.image || undefined,
          }))
        : [];
    } catch (error) {
      console.error(`Finnhub error for ${symbol}:`, error);
      return [];
    }
  }

  private deduplicate(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.url || item.title.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getStockNews(symbol: string, days: number = 7): Promise<NewsItem[]> {
    const cacheKey = `stock_news_${symbol}_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results = await Promise.allSettled([
      this.fetchFinnhubNews(symbol, days),
      this.yahooFinanceProvider.getNews(symbol, days),
      this.alphaVantageProvider.getNews(symbol, days),
    ]);

    const allNews: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }

    const merged = this.deduplicate(allNews);
    merged.sort((a, b) => b.timestamp - a.timestamp);
    const limited = merged.slice(0, this.MAX_RESULTS);

    this.setCache(cacheKey, limited);
    return limited;
  }

  async getCryptoNews(symbol: string, limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `crypto_news_${symbol}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const upperSymbol = symbol.toUpperCase();

    const results = await Promise.allSettled([
      this.yahooFinanceProvider.getNews(upperSymbol, 7),
      this.alphaVantageProvider.getNews(upperSymbol, 7),
    ]);

    const allNews: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }

    const merged = this.deduplicate(allNews);
    merged.sort((a, b) => b.timestamp - a.timestamp);
    const limited = merged.slice(0, limit);

    this.setCache(cacheKey, limited);
    return limited;
  }

  async searchMarketNews(query: string, limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `market_news_search_${query}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const results = await Promise.allSettled([
      this.alphaVantageProvider.getNews(query, 7),
    ]);

    const allNews: NewsItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }

    const merged = this.deduplicate(allNews);
    merged.sort((a, b) => b.timestamp - a.timestamp);
    const limited = merged.slice(0, limit);

    this.setCache(cacheKey, limited);
    return limited;
  }

  async getFinancialHeadlines(category: string = 'business', limit: number = 10): Promise<NewsItem[]> {
    return [];
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const newsService = new NewsService();
export default newsService;
