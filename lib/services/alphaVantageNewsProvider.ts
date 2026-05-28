import { NewsItem, Sentiment } from '@/lib/types';
import { NewsProvider } from './newsProvider';

export class AlphaVantageNewsProvider implements NewsProvider {
  readonly name = 'Alpha Vantage';
  readonly enabled = true;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ALPHAVANTAGE_KEY || process.env.NEXT_PUBLIC_ALPHAVANTAGE_KEY || '';
    if (!this.apiKey) {
      console.warn('AlphaVantageNewsProvider: No API key found (tried ALPHAVANTAGE_KEY / NEXT_PUBLIC_ALPHAVANTAGE_KEY)');
    }
  }

  async getNews(symbol: string, days: number = 7): Promise<NewsItem[]> {
    if (!this.apiKey) return [];

    try {
      const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${this.apiKey}`;

      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) return [];

      const data = await response.json();

      if (!data.feed || !Array.isArray(data.feed)) {
        if (data.Information || data.Note) {
          console.warn(`AlphaVantageNewsProvider: ${data.Information || data.Note}`);
        }
        return [];
      }

      const newsItems: NewsItem[] = [];
      const now = Date.now();

      for (const article of data.feed) {
        if (!article.title) continue;

        const tickerSentiment = article.ticker_sentiment?.find(
          (ts: any) => ts.ticker?.toUpperCase() === symbol.toUpperCase()
        );

        const score = tickerSentiment
          ? parseFloat(tickerSentiment.ticker_sentiment_score) || article.overall_sentiment_score || 0
          : article.overall_sentiment_score || 0;

        newsItems.push({
          id: `av-${this.simpleHash(article.url || article.title)}`,
          title: article.title,
          description: article.summary || '',
          source: article.source || 'Alpha Vantage',
          url: article.url || '',
          timestamp: article.time_published
            ? this.parseAlphaVantageDate(article.time_published)
            : now,
          sentiment: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
          relevantAssets: [symbol.toUpperCase()],
          imageUrl: article.banner_image || undefined,
        });
      }

      return newsItems;
    } catch (error) {
      console.error(`AlphaVantageNewsProvider error for ${symbol}:`, error);
      return [];
    }
  }

  private parseAlphaVantageDate(dateStr: string): number {
    try {
      const iso = dateStr.replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
        '$1-$2-$3T$4:$5:$6Z'
      );
      return new Date(iso).getTime();
    } catch {
      return Date.now();
    }
  }

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
