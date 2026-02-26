'use client';

import React, { useState } from 'react';
import { useCoinPrice, useStockQuote, useNews, useTrendingCoins } from '@/app/hooks/useMarketAPI';
import { TrendingUp, TrendingDown, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Componente de ejemplo que demuestra el uso de las APIs reales
 * Puedes usar este componente como referencia para integrar en tu app
 */

interface APIDemoProps {
  coinId?: string;
  stockSymbol?: string;
  newsQuery?: string;
}

export function APIDemo({
  coinId = 'bitcoin',
  stockSymbol = 'AAPL',
  newsQuery = 'Bitcoin'
}: APIDemoProps) {
  const [activeTab, setActiveTab] = useState<'crypto' | 'stocks' | 'news' | 'trending'>('crypto');

  // ========== CRYPTO ==========
  const {
    data: coinPrice,
    loading: coinLoading,
    error: coinError
  } = useCoinPrice(coinId, true);

  // ========== STOCKS ==========
  const {
    data: stockQuote,
    loading: stockLoading,
    error: stockError
  } = useStockQuote(stockSymbol, true);

  // ========== NEWS ==========
  const {
    data: news,
    loading: newsLoading,
    error: newsError
  } = useNews(newsQuery, 5, true);

  // ========== TRENDING ==========
  const {
    data: trending,
    loading: trendingLoading,
    error: trendingError
  } = useTrendingCoins(true);

  return (
    <div className="card-glass p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Demo de APIs en Tiempo Real</h2>
        <p className="text-sm text-muted-foreground">
          Conectado a CoinGecko, Finnhub, NewsAPI y Alpha Vantage
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-muted/30">
        {(['crypto', 'stocks', 'news', 'trending'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-64">
        {/* CRYPTO TAB */}
        {activeTab === 'crypto' && (
          <CryptoTab
            coinPrice={coinPrice}
            loading={coinLoading}
            error={coinError}
          />
        )}

        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <StocksTab
            stockQuote={stockQuote}
            loading={stockLoading}
            error={stockError}
          />
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <NewsTab
            articles={news}
            loading={newsLoading}
            error={newsError}
          />
        )}

        {/* TRENDING TAB */}
        {activeTab === 'trending' && (
          <TrendingTab
            coins={trending}
            loading={trendingLoading}
            error={trendingError}
          />
        )}
      </div>
    </div>
  );
}

// ========== CRYPTO TAB COMPONENT ==========

interface CryptoTabProps {
  coinPrice: any;
  loading: boolean;
  error: string | null;
}

function CryptoTab({ coinPrice, loading, error }: CryptoTabProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
        <AlertCircle className="w-5 h-5 text-secondary" />
        <div>
          <p className="font-semibold">Error obteniendo datos de CoinGecko</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Obteniendo datos de CoinGecko...</p>
        </div>
      </div>
    );
  }

  if (!coinPrice) {
    return <p className="text-center text-muted-foreground">Sin datos disponibles</p>;
  }

  const isPositive = coinPrice.priceChangePercentage24h >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Precio Actual */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Precio Actual</p>
          <p className="text-2xl font-bold">${coinPrice.price.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1 capitalize">{coinPrice.name}</p>
        </div>

        {/* Cambio 24h */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Cambio 24h</p>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-primary' : 'text-secondary'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <p className="text-2xl font-bold">
              {isPositive ? '+' : ''}{coinPrice.priceChangePercentage24h.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Market Cap */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Market Cap</p>
          <p className="text-lg font-bold">
            ${(coinPrice.marketCap / 1e9).toFixed(2)}B
          </p>
        </div>

        {/* Volumen 24h */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Volumen 24h</p>
          <p className="text-lg font-bold">
            ${(coinPrice.volume24h / 1e9).toFixed(2)}B
          </p>
        </div>

        {/* Cambio 7d */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Cambio 7d</p>
          <p className={`text-lg font-bold ${coinPrice.priceChangePercentage7d >= 0 ? 'text-primary' : 'text-secondary'}`}>
            {coinPrice.priceChangePercentage7d >= 0 ? '+' : ''}{coinPrice.priceChangePercentage7d.toFixed(2)}%
          </p>
        </div>

        {/* Cambio 30d */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Cambio 30d</p>
          <p className={`text-lg font-bold ${coinPrice.priceChangePercentage30d >= 0 ? 'text-primary' : 'text-secondary'}`}>
            {coinPrice.priceChangePercentage30d >= 0 ? '+' : ''}{coinPrice.priceChangePercentage30d.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Gráfico Sparkline */}
      {coinPrice.sparkline && coinPrice.sparkline.length > 0 && (
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Últimos 7 días</p>
          <div className="h-16 w-full bg-muted/5 rounded flex items-end gap-0.5 p-2">
            {coinPrice.sparkline.map((price: number, idx: number) => {
              const minPrice = Math.min(...coinPrice.sparkline);
              const maxPrice = Math.max(...coinPrice.sparkline);
              const range = maxPrice - minPrice || 1;
              const height = ((price - minPrice) / range) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-primary/50 rounded-sm"
                  style={{ height: `${height}%` }}
                  title={`$${price.toFixed(2)}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== STOCKS TAB COMPONENT ==========

interface StocksTabProps {
  stockQuote: any;
  loading: boolean;
  error: string | null;
}

function StocksTab({ stockQuote, loading, error }: StocksTabProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
        <AlertCircle className="w-5 h-5 text-secondary" />
        <div>
          <p className="font-semibold">Error obteniendo datos de Finnhub</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Obteniendo datos de Finnhub...</p>
        </div>
      </div>
    );
  }

  if (!stockQuote) {
    return <p className="text-center text-muted-foreground">Sin datos disponibles</p>;
  }

  const isPositive = stockQuote.changePercent >= 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Símbolo */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Símbolo</p>
          <p className="text-2xl font-bold">{stockQuote.symbol}</p>
        </div>

        {/* Precio */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Precio</p>
          <p className="text-2xl font-bold">${stockQuote.price.toFixed(2)}</p>
        </div>

        {/* Cambio */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Cambio</p>
          <div className={`flex items-center gap-2 ${isPositive ? 'text-primary' : 'text-secondary'}`}>
            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <p className="text-xl font-bold">
              {isPositive ? '+' : ''}{stockQuote.change.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Cambio % */}
        <div className="p-4 bg-muted/10 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Cambio %</p>
          <p className={`text-xl font-bold ${isPositive ? 'text-primary' : 'text-secondary'}`}>
            {isPositive ? '+' : ''}{stockQuote.changePercent.toFixed(2)}%
          </p>
        </div>

        {stockQuote.bid && (
          <div className="p-4 bg-muted/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Bid</p>
            <p className="text-lg font-bold">${stockQuote.bid.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">x {stockQuote.bidSize}</p>
          </div>
        )}

        {stockQuote.ask && (
          <div className="p-4 bg-muted/10 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Ask</p>
            <p className="text-lg font-bold">${stockQuote.ask.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">x {stockQuote.askSize}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
        <p className="text-sm">
          💡 Datos en tiempo real actualizados cada 5 segundos desde <strong>Finnhub API</strong>
        </p>
      </div>
    </div>
  );
}

// ========== NEWS TAB COMPONENT ==========

interface NewsTabProps {
  articles: any[];
  loading: boolean;
  error: string | null;
}

function NewsTab({ articles, loading, error }: NewsTabProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
        <AlertCircle className="w-5 h-5 text-secondary" />
        <div>
          <p className="font-semibold">Error obteniendo noticias de NewsAPI</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Obteniendo noticias de NewsAPI...</p>
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return <p className="text-center text-muted-foreground">Sin noticias disponibles</p>;
  }

  return (
    <div className="space-y-3">
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 bg-muted/10 hover:bg-muted/20 rounded-lg transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {article.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-muted-foreground">{article.source}</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${
                  article.sentiment === 'positive' ? 'bg-primary/20 text-primary' :
                  article.sentiment === 'negative' ? 'bg-secondary/20 text-secondary' :
                  'bg-muted/20 text-muted-foreground'
                }`}>
                  {article.sentiment}
                </span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ========== TRENDING TAB COMPONENT ==========

interface TrendingTabProps {
  coins: any[];
  loading: boolean;
  error: string | null;
}

function TrendingTab({ coins, loading, error }: TrendingTabProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/30">
        <AlertCircle className="w-5 h-5 text-secondary" />
        <div>
          <p className="font-semibold">Error obteniendo monedas trending</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Obteniendo monedas trending...</p>
        </div>
      </div>
    );
  }

  if (!coins || coins.length === 0) {
    return <p className="text-center text-muted-foreground">Sin datos de trending</p>;
  }

  return (
    <div className="space-y-2">
      {coins.map((coin, idx) => (
        <div key={coin.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {idx + 1}
            </div>
            <div>
              <p className="font-semibold text-sm">{coin.name}</p>
              <p className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            {coin.image && (
              <img
                src={coin.image}
                alt={coin.name}
                className="w-6 h-6 rounded-full mb-1"
              />
            )}
            {coin.marketCapRank && (
              <p className="text-xs text-muted-foreground">#{coin.marketCapRank}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

