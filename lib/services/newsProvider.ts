import { NewsItem } from '@/lib/types';

export interface NewsProvider {
  readonly name: string;
  readonly enabled: boolean;
  getNews(symbol: string, days?: number): Promise<NewsItem[]>;
}
