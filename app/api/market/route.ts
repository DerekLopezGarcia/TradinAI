import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/services/marketService';
import { newsService } from '@/lib/services/newsService';
import { TimeFrame } from '@/lib/types';

/**
 * API de Mercado - Obtiene datos de precios, históricos y noticias
 * GET /api/market
 *
 * Parámetros de query:
 * - symbol: Símbolo del activo (BTCUSD, ETHUSD, AAPL, etc.) - default: BTCUSD
 * - type: Tipo de datos a obtener (price, history, news) - default: price
 * - interval: Intervalo temporal para datos históricos (1h, 4h, 1d, 1w) - default: 1h
 */

// ==================== MAPEOS ====================

/** Mapeo de símbolos a IDs de CoinGecko */
const COINGECKO_IDS: Record<string, string> = {
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'SOLUSD': 'solana',
  'XRPUSD': 'ripple',
  'ADAUSD': 'cardano',
  'DOGEUSD': 'dogecoin',
  'POLKAUSD': 'polkadot',
  'LITEUSD': 'litecoin',
};

/** Símbolos de criptomonedas conocidas */
const CRYPTO_SYMBOLS = Object.keys(COINGECKO_IDS);

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Determina si un símbolo corresponde a una criptomoneda
 * @param symbol - Símbolo a verificar
 * @returns true si es criptomoneda, false si es stock
 */
function isCrypto(symbol: string): boolean {
  return CRYPTO_SYMBOLS.includes(symbol);
}

/**
 * Calcula el número de días basado en el intervalo
 * @param interval - Intervalo temporal
 * @returns Número de días a recuperar
 */
function getDaysByInterval(interval: TimeFrame): number {
  const days: Record<string, number> = {
    '1m': 1,
    '5m': 1,
    '15m': 1,
    '1h': 7,
    '4h': 30,
    '1d': 90,
    '1w': 365,
  };
  return days[interval] || 30;
}

/**
 * Mapea TimeFrame a resolución de Finnhub
 * @param interval - Intervalo temporal
 * @returns Resolución para Finnhub
 */
function mapIntervalToResolution(interval: TimeFrame): string {
  const mapping: Record<TimeFrame, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
  };
  return mapping[interval] || '60';
}

// ==================== MANEJADORES DE TIPOS DE DATOS ====================

/**
 * Obtiene datos históricos (candlesticks)
 */
async function getHistoryData(symbol: string, interval: TimeFrame) {
  const days = getDaysByInterval(interval);

  if (isCrypto(symbol)) {
    const coinId = COINGECKO_IDS[symbol] || 'bitcoin';
    const data = await marketService.getCoinHistory(coinId, days);
    return {
      symbol,
      interval,
      data,
      source: 'CoinGecko',
      timestamp: Date.now(),
    };
  } else {
    // Para stocks usar Finnhub
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 24 * 60 * 60;
    const resolution = mapIntervalToResolution(interval);
    const data = await marketService.getStockCandles(symbol, resolution, from, to);
    return {
      symbol,
      interval,
      data,
      source: 'Finnhub',
      timestamp: Date.now(),
    };
  }
}

/**
 * Obtiene noticias relacionadas al símbolo
 */
async function getNewsData(symbol: string) {
  let news;
  let source: string;

  if (isCrypto(symbol)) {
    const coinName = symbol.replace('USD', '').toLowerCase();
    news = await newsService.getCryptoNews(coinName, 10);
    source = 'NewsAPI (Crypto)';
  } else {
    news = await newsService.getStockNews(symbol, 7);
    source = 'Finnhub';
  }

  return {
    symbol,
    news,
    source,
    newsCount: news.length,
    timestamp: Date.now(),
  };
}

/**
 * Obtiene el precio actual del activo
 */
async function getPriceData(symbol: string) {
  if (isCrypto(symbol)) {
    const coinId = COINGECKO_IDS[symbol] || 'bitcoin';
    const coinPrice = await marketService.getCoinPrice(coinId);
    return {
      symbol,
      price: coinPrice.price,
      change: (coinPrice.price * coinPrice.priceChangePercentage24h) / 100,
      changePercent: coinPrice.priceChangePercentage24h,
      marketCap: coinPrice.marketCap,
      volume24h: coinPrice.volume24h,
      source: 'CoinGecko',
      timestamp: coinPrice.lastUpdated,
    };
  } else {
    const stockQuote = await marketService.getStockQuote(symbol);
    return {
      symbol,
      price: stockQuote.price,
      change: stockQuote.change,
      changePercent: stockQuote.changePercent,
      bid: stockQuote.bid,
      ask: stockQuote.ask,
      source: 'Finnhub',
      timestamp: stockQuote.timestamp,
    };
  }
}

// ==================== HANDLER PRINCIPAL ====================

/**
 * GET /api/market
 *
 * Endpoint principal para obtener datos de mercado
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'BTCUSD';
  const type = searchParams.get('type')?.toLowerCase() || 'price';
  const interval = (searchParams.get('interval') || '1h') as TimeFrame;

  try {
    // Validar parámetros
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Procesar según tipo de solicitud
    switch (type) {
      case 'history':
        const historyData = await getHistoryData(symbol, interval);
        return NextResponse.json(historyData);

      case 'news':
        const newsData = await getNewsData(symbol);
        return NextResponse.json(newsData);

      case 'price':
      default:
        const priceData = await getPriceData(symbol);
        return NextResponse.json(priceData);
    }
  } catch (error) {
    console.error('Market API error:', {
      symbol,
      type,
      interval,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        symbol,
        type,
        timestamp: Date.now(),
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
      },
      { status: 500 }
    );
  }
}

