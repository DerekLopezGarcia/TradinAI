'use client';

import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { NewsItem } from '@/lib/types';
import { Zap, ExternalLink } from 'lucide-react';

interface NewsFeedProps {
  symbol?: string;
}

export function NewsFeed({ symbol }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: news.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 148,
    overscan: 3,
  });

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Zap className="w-5 h-5 animate-pulse text-muted-foreground" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Sin noticias</div>
        ) : (
          <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = news[virtualItem.index];
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-0 left-0 w-full p-4 hover:bg-muted/50 transition-colors group border-b border-border"
                  style={{ transform: `translateY(${virtualItem.start}px)`, height: `${virtualItem.size}px` }}
                >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '➡️'}
                    {' '}{item.sentiment}
                  </span>
                  {item.sentimentStrength && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.sentimentStrength === 'strong' ? 'bg-blue-500/10 text-blue-600' :
                      item.sentimentStrength === 'moderate' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {item.sentimentStrength === 'strong' ? 'Fuerte' :
                       item.sentimentStrength === 'moderate' ? 'Moderado' : 'Débil'}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{item.source}</span>
                </div>
                {(item.sentimentScore !== undefined || item.sentimentConfidence !== undefined) && (
                  <div className="flex items-center gap-3">
                    {item.sentimentScore !== undefined && (
                      <div className="flex-1 max-w-[120px]">
                        <div className="relative h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm transition-all"
                            style={{ left: `${((item.sentimentScore + 1) / 2) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.sentimentConfidence !== undefined && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.sentimentConfidence}% confianza
                      </span>
                    )}
                  </div>
                )}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

