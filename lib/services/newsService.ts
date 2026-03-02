import { NewsItem, Sentiment } from '@/lib/types';

/**
 * Servicio centralizado para obtener y gestionar noticias
 * Soporta: Finnhub para acciones, NewsAPI para criptomonedas y búsquedas generales
 */

class NewsService {
  private finnhubApiKey = process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
  private newsApiKey = process.env.NEXT_PUBLIC_NEWS_API_KEY || '';
  private cache = new Map<string, { data: NewsItem[]; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutos

  /**
   * Analiza el sentimiento de un texto
   * @param text - Texto a analizar
   * @returns Sentimiento detectado: 'positive', 'negative', o 'neutral'
   */
  private analyzeSentiment(text: string): Sentiment {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'sube',
      'gana',
      'crece',
      'récord',
      'alcista',
      'compra',
      'bullish',
      'rally',
      'boom',
      'éxito',
      'ganancias',
      'aprueban',
      'acuerdo',
      'optimismo',
      'positivo',
      'prosperidad',
      'avance',
      'mejora',
    ];

    const negativeWords = [
      'baja',
      'pierde',
      'caída',
      'crisis',
      'bajista',
      'vende',
      'bearish',
      'crash',
      'pánico',
      'fracaso',
      'pérdidas',
      'rechazo',
      'conflicto',
      'pesimismo',
      'negativo',
      'desplome',
      'declive',
      'colapso',
    ];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Obtiene del caché si está disponible y no ha expirado
   * @param key - Clave del caché
   * @returns Datos del caché o null
   */
  private getFromCache(key: string): NewsItem[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Guarda en caché los resultados
   * @param key - Clave del caché
   * @param data - Datos a guardar
   */
  private setCache(key: string, data: NewsItem[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Formatea una fecha ISO a timestamp
   * @param date - Fecha en formato ISO, timestamp o Date
   * @returns Timestamp en milisegundos
   */
  private formatDate(date: string | number | Date): string {
    if (typeof date === 'number') {
      return new Date(date * 1000).toISOString().split('T')[0];
    }
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Obtiene noticias de acciones usando Finnhub API
   * @param symbol - Símbolo de la acción (ej: AAPL, MSFT)
   * @param days - Número de días hacia atrás (default: 7)
   * @returns Array de NewsItem
   */
  async getStockNews(symbol: string, days: number = 7): Promise<NewsItem[]> {
    const cacheKey = `stock_news_${symbol}_${days}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const from = new Date();
      from.setDate(from.getDate() - days);
      const to = new Date();

      const fromDate = this.formatDate(from);
      const toDate = this.formatDate(to);

      const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${this.finnhubApiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();

      const newsItems: NewsItem[] = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            title: item.headline || 'Sin título',
            description: item.summary || '',
            source: item.source || 'Finnhub',
            url: item.url || '',
            timestamp: (item.datetime || Math.floor(Date.now() / 1000)) * 1000,
            sentiment: this.analyzeSentiment((item.headline || '') + ' ' + (item.summary || '')),
            relevantAssets: [symbol],
            imageUrl: item.image || undefined,
          }))
        : [];

      this.setCache(cacheKey, newsItems);
      return newsItems;
    } catch (error) {
      console.error(`Error fetching stock news for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Obtiene noticias de criptomonedas usando NewsAPI
   * @param coin - Nombre o símbolo de la criptomoneda (ej: bitcoin, ethereum)
   * @param limit - Número máximo de artículos (default: 10)
   * @returns Array de NewsItem
   */
  async getCryptoNews(coin: string, limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `crypto_news_${coin}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const query = encodeURIComponent(`${coin} cryptocurrency`);
      const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=${limit}&language=es&apiKey=${this.newsApiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();

      const newsItems: NewsItem[] = (data.articles || []).map((item: any, index: number) => ({
        id: item.url || index.toString(),
        title: item.title || 'Sin título',
        description: item.description || '',
        source: item.source?.name || 'NewsAPI',
        url: item.url || '',
        timestamp: new Date(item.publishedAt).getTime(),
        sentiment: this.analyzeSentiment((item.title || '') + ' ' + (item.description || '')),
        relevantAssets: [coin.toUpperCase()],
        imageUrl: item.urlToImage || undefined,
      }));

      this.setCache(cacheKey, newsItems);
      return newsItems;
    } catch (error) {
      console.error(`Error fetching crypto news for ${coin}:`, error);
      return [];
    }
  }

  /**
   * Búsqueda general de noticias financieras
   * @param query - Término de búsqueda
   * @param limit - Número máximo de artículos (default: 10)
   * @returns Array de NewsItem
   */
  async searchMarketNews(query: string, limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `market_news_search_${query}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=publishedAt&pageSize=${limit}&language=es&apiKey=${this.newsApiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();

      const newsItems: NewsItem[] = (data.articles || []).map((item: any, index: number) => ({
        id: item.url || index.toString(),
        title: item.title || 'Sin título',
        description: item.description || '',
        source: item.source?.name || 'NewsAPI',
        url: item.url || '',
        timestamp: new Date(item.publishedAt).getTime(),
        sentiment: this.analyzeSentiment((item.title || '') + ' ' + (item.description || '')),
        relevantAssets: [query.toUpperCase()],
        imageUrl: item.urlToImage || undefined,
      }));

      this.setCache(cacheKey, newsItems);
      return newsItems;
    } catch (error) {
      console.error(`Error searching market news for "${query}":`, error);
      return [];
    }
  }

  /**
   * Obtiene noticias por categoría financiera
   * @param category - Categoría (business, technology, general) (default: business)
   * @param limit - Número máximo de artículos (default: 10)
   * @returns Array de NewsItem
   */
  async getFinancialHeadlines(category: string = 'business', limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `headlines_${category}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://newsapi.org/v2/top-headlines?category=${category}&language=es&pageSize=${limit}&apiKey=${this.newsApiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
      }

      const data = await response.json();

      const newsItems: NewsItem[] = (data.articles || []).map((item: any, index: number) => ({
        id: item.url || index.toString(),
        title: item.title || 'Sin título',
        description: item.description || '',
        source: item.source?.name || 'NewsAPI',
        url: item.url || '',
        timestamp: new Date(item.publishedAt).getTime(),
        sentiment: this.analyzeSentiment((item.title || '') + ' ' + (item.description || '')),
        relevantAssets: [],
        imageUrl: item.urlToImage || undefined,
      }));

      this.setCache(cacheKey, newsItems);
      return newsItems;
    } catch (error) {
      console.error(`Error fetching ${category} headlines:`, error);
      return [];
    }
  }

  /**
   * Limpia el caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// ========== SINGLETON INSTANCE ==========
export const newsService = new NewsService();
export default newsService;

