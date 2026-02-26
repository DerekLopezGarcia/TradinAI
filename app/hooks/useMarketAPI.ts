'use client';

import { useState, useEffect, useCallback } from 'react';
import { CandleData } from '@/lib/types';
import { marketService, CoinPrice, StockQuote, NewsArticle, Coin, OHLCV } from '@/lib/services/marketService';
import toast from 'react-hot-toast';

/**
 * Hook para obtener precio de criptomoneda
 */
export function useCoinPrice(coinId: string, enabled: boolean = true) {
  const [data, setData] = useState<CoinPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !coinId) {
      setLoading(false);
      return;
    }

    const fetchPrice = async () => {
      try {
        setLoading(true);
        const price = await marketService.getCoinPrice(coinId);
        setData(price);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching price');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();

    // Refrescar cada 30 segundos
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [coinId, enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener múltiples precios de criptomonedas
 */
export function useCoinPrices(coinIds: string[], enabled: boolean = true) {
  const [data, setData] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || coinIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        const prices = await marketService.getCoinPrices(coinIds);
        setData(prices);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching prices');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [coinIds.join(','), enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener monedas trending
 */
export function useTrendingCoins(enabled: boolean = true) {
  const [data, setData] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchTrending = async () => {
      try {
        setLoading(true);
        const coins = await marketService.getTrendingCoins();
        setData(coins);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching trending coins');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();

    const interval = setInterval(fetchTrending, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, [enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener historial de monedas
 */
export function useCoinHistory(coinId: string, days: number = 30, enabled: boolean = true) {
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !coinId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await marketService.getCoinHistory(coinId, days);
        setData(history);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching history');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [coinId, days, enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener cotización de acciones
 */
export function useStockQuote(symbol: string, enabled: boolean = true) {
  const [data, setData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const quote = await marketService.getStockQuote(symbol);
        setData(quote);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching quote');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();

    const interval = setInterval(fetchQuote, 5000); // Cada 5 segundos
    return () => clearInterval(interval);
  }, [symbol, enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener velas de acciones (candles)
 */
export function useStockCandles(
  symbol: string,
  resolution: string = '60',
  from?: number,
  to?: number,
  enabled: boolean = true
) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol || !from || !to) {
      setLoading(false);
      return;
    }

    const fetchCandles = async () => {
      try {
        setLoading(true);
        const candles = await marketService.getStockCandles(symbol, resolution, from, to);
        setData(candles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching candles');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
  }, [symbol, resolution, from, to, enabled]);

  return { data, loading, error };
}

/**
 * Hook para suscribirse a actualizaciones en tiempo real de acciones (WebSocket)
 */
export function useStockSubscription(symbol: string, enabled: boolean = true) {
  const [data, setData] = useState<StockQuote | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) return;

    try {
      setConnected(true);
      const unsubscribe = marketService.subscribeToStock(symbol, (quote) => {
        setData(quote);
        setError(null);
      });

      return () => {
        unsubscribe();
        setConnected(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error subscribing to stock');
      setConnected(false);
    }
  }, [symbol, enabled]);

  return { data, connected, error };
}

/**
 * Hook para obtener noticias
 */
export function useNews(query: string, limit: number = 10, enabled: boolean = true) {
  const [data, setData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    if (!enabled || !query) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const news = await marketService.getNews(query, limit);
      setData(news);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching news');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [query, limit, enabled]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { data, loading, error, refetch: fetchNews };
}

/**
 * Hook para obtener titulares
 */
export function useHeadlines(category: string = 'business', limit: number = 10, enabled: boolean = true) {
  const [data, setData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHeadlines = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headlines = await marketService.getHeadlines(category, limit);
      setData(headlines);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching headlines');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit, enabled]);

  useEffect(() => {
    fetchHeadlines();
  }, [fetchHeadlines]);

  return { data, loading, error, refetch: fetchHeadlines };
}

/**
 * Hook para obtener datos históricos con Alpha Vantage
 */
export function useCandles(
  symbol: string,
  interval: string = 'daily',
  limit: number = 100,
  enabled: boolean = true
) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setLoading(false);
      return;
    }

    const fetchCandles = async () => {
      try {
        setLoading(true);
        const candles = await marketService.getCandles(symbol, interval, limit);
        setData(candles);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching candles');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
  }, [symbol, interval, limit, enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener indicadores técnicos
 */
export function useTechnicalIndicator(
  symbol: string,
  indicator: string,
  interval: string = '60min',
  timePeriod: number = 20,
  enabled: boolean = true
) {
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !symbol || !indicator) {
      setLoading(false);
      return;
    }

    const fetchIndicator = async () => {
      try {
        setLoading(true);
        const result = await marketService.getTechnicalIndicator(
          symbol,
          indicator,
          interval,
          timePeriod
        );
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching indicator');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicator();
  }, [symbol, indicator, interval, timePeriod, enabled]);

  return { data, loading, error };
}

/**
 * Hook para manejo de errores con toast
 */
export function useMarketError(error: string | null, message: string = 'Error en API') {
  useEffect(() => {
    if (error) {
      toast.error(`${message}: ${error}`);
    }
  }, [error, message]);
}


