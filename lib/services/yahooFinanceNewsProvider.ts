import { NewsItem, Sentiment } from '@/lib/types';
import { NewsProvider } from './newsProvider';

export class YahooFinanceNewsProvider implements NewsProvider {
  readonly name = 'Yahoo Finance (RSS)';
  readonly enabled = true;

  async getNews(symbol: string, days: number = 7): Promise<NewsItem[]> {
    try {
      const yahooSymbol = this.toYahooSymbol(symbol);
      const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${yahooSymbol}&region=US&lang=en-US`;

      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return [];

      const xml = await response.text();
      if (!xml || xml.length < 200) return [];

      return this.parseRSSItems(xml, symbol);
    } catch (error) {
      console.error(`YahooFinanceNewsProvider error for ${symbol}:`, error);
      return [];
    }
  }

  private toYahooSymbol(symbol: string): string {
    const upper = symbol.toUpperCase();
    if (upper.endsWith('USD') && upper.length > 4) {
      const base = upper.slice(0, -3);
      if (base.length <= 5) return `${base}-USD`;
    }
    return upper;
  }

  private parseRSSItems(xml: string, originalSymbol: string): NewsItem[] {
    const items: NewsItem[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(xml)) !== null) {
      const content = itemMatch[1];

      const title = this.extractField(content, 'title');
      const link = this.extractField(content, 'link');
      const description = this.extractField(content, 'description');
      const pubDate = this.extractField(content, 'pubDate');
      const source = this.extractField(content, 'source');

      if (!title && !link) continue;

      const decodedTitle = this.decodeHtmlEntities(title) || 'Sin título';
      const decodedDesc = this.decodeHtmlEntities(description) || '';

      items.push({
        id: `yh-${this.simpleHash(link || decodedTitle)}`,
        title: decodedTitle,
        description: decodedDesc,
        source: source || 'Yahoo Finance',
        url: link || '',
        timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
        sentiment: this.analyzeSentiment(decodedTitle + ' ' + decodedDesc),
        relevantAssets: [originalSymbol.toUpperCase()],
      });
    }

    return items;
  }

  private extractField(content: string, tag: string): string {
    const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
    const cdataMatch = content.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    const textRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const textMatch = content.match(textRegex);
    if (textMatch) return textMatch[1].trim();

    return '';
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

  private analyzeSentiment(text: string): Sentiment {
    const lowerText = text.toLowerCase();
    const positiveWords = [
      'sube', 'gana', 'crece', 'récord', 'alcista', 'compra', 'bullish',
      'rally', 'boom', 'éxito', 'ganancias', 'aprueban', 'acuerdo',
      'optimismo', 'positivo', 'prosperidad', 'avance', 'mejora',
      'up', 'gain', 'rise', 'surge', 'record', 'bull', 'profit',
      'growth', 'strong', 'upgrade', 'beat', 'outperform',
    ];
    const negativeWords = [
      'baja', 'pierde', 'caída', 'crisis', 'bajista', 'vende', 'bearish',
      'crash', 'pánico', 'fracaso', 'pérdidas', 'rechazo', 'conflicto',
      'pesimismo', 'negativo', 'desplome', 'declive', 'colapso',
      'down', 'fall', 'drop', 'decline', 'loss', 'bear', 'sell',
      'crash', 'weak', 'miss', 'downgrade', 'risk', 'recession',
    ];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}
