'use client';

import { useState, useEffect } from 'react';
import { NewsItem } from '@/lib/types';
import { Zap, ExternalLink } from 'lucide-react';

interface NewsFeedProps {
  symbol?: string;
}

export function NewsFeed({ symbol }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      if (!symbol) return; // Validación: símbolo requerido
      
      // Validar que el símbolo sea válido (alphanumérico, máximo 20 caracteres)
      if (!/^[A-Z0-9]{1,20}$/.test(symbol)) {
        console.warn('Invalid symbol format:', symbol);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('symbol', symbol);
        params.set('type', 'news');
        
        const response = await fetch(`/api/market?${params.toString()}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data = await response.json();
        setNews(data.news || []);
      } catch (e) {
        console.error('Error fetching news:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [symbol]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'negative': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Noticias</h3>
        <p className="text-xs text-muted-foreground">{symbol ? `Sobre ${symbol}` : 'Mercados'}</p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Zap className="w-5 h-5 animate-pulse text-muted-foreground" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Sin noticias</div>
        ) : (
          <div className="divide-y divide-border">
            {news.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '➡️'}
                    {' '}{item.sentiment}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.source}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

