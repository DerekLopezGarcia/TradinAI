import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/services/marketService';
import { newsService } from '@/lib/services/newsService';
import { TimeFrame, CandleData } from '@/lib/types';

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

/** Símbolos de acciones */
const STOCK_SYMBOLS = new Set([
  'AAPL', 'GOOGL', 'TSLA', 'MSFT', 'AMZN', 'META', 'NVDA',
  'JPM', 'BAC', 'GS', 'BA', 'CAT', 'MMM'
]);

/** Símbolos de índices */
const INDEX_SYMBOLS = new Set([
  'SPX', 'INDU', 'CCMP', 'VIX'
]);

/** Símbolos de Forex */
const FOREX_SYMBOLS = new Set([
  'EURUSD', 'GBPUSD', 'JPYUSD', 'CHFUSD', 'AUDUSD', 'CADMXN'
]);

/** Símbolos de commodities */
const COMMODITY_SYMBOLS = new Set([
  'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'COPPER', 'CRUDE', 'NATGAS'
]);

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Determina el tipo de activo (crypto, stock, index, forex, commodity)
 * @param symbol - Símbolo a verificar
 * @returns tipo del activo
 */
function getAssetType(symbol: string): 'crypto' | 'stock' | 'index' | 'forex' | 'commodity' {
  if (CRYPTO_SYMBOLS.includes(symbol)) return 'crypto';
  if (STOCK_SYMBOLS.has(symbol)) return 'stock';
  if (INDEX_SYMBOLS.has(symbol)) return 'index';
  if (FOREX_SYMBOLS.has(symbol)) return 'forex';
  if (COMMODITY_SYMBOLS.has(symbol)) return 'commodity';
  return 'stock'; // default
}

/**
 * Determina si un símbolo es una criptomoneda
 * @param symbol - Símbolo a verificar
 * @returns true si es criptomoneda
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
  // Para crypto: getCoinHistory gestiona sus propios días según el endpoint OHLC.
  // Para stocks (Yahoo): estos son los días que se piden al rango.
  const days: Record<string, number> = {
    '1m':  1,
    '5m':  1,
    '15m': 1,
    '1h':  7,
    '4h':  30,
    '1d':  90,
    '1w':  365,
  };
  return days[interval] ?? 30;
}

/**
 * Mapea TimeFrame a resolución de Finnhub
 * @param interval - Intervalo temporal
 * @returns Resolución para Finnhub
 */
// Función removida - ya no se necesita

// ==================== MANEJADORES DE TIPOS DE DATOS ====================

/**
 * Obtiene datos históricos reales (candlesticks). Sin fallback simulado.
 * Si la API no responde lanza un error para que el cliente lo maneje.
 */
async function getHistoryData(symbol: string, interval: TimeFrame) {
  const days = getDaysByInterval(interval);

  if (isCrypto(symbol)) {
    const coinId = COINGECKO_IDS[symbol] || 'bitcoin';
    const data = await marketService.getCoinHistory(coinId, days, interval);
    if (!data || data.length === 0) {
      throw new Error(`No hay datos históricos para ${symbol}`);
    }
    return { symbol, interval, data, source: 'CoinGecko', isFallback: false, timestamp: Date.now() };
  } else {
    const data = await marketService.getStockHistory(symbol, interval, days);
    if (!data || data.length === 0) {
      throw new Error(`No hay datos históricos para ${symbol}`);
    }
    return { symbol, interval, data, source: 'Finnhub', isFallback: false, timestamp: Date.now() };
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
 * Obtiene el precio actual del activo.
 * Crypto → CoinGecko
 * Todo lo demás → Yahoo Finance (sin API key, funciona en plan gratuito)
 *                con fallback a Finnhub si Yahoo falla.
 */
async function getPriceData(symbol: string) {
  const assetType = getAssetType(symbol);

  if (assetType === 'crypto') {
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
      type: 'crypto',
      timestamp: coinPrice.lastUpdated,
    };
  }

  // Stocks, índices, forex, commodities → Yahoo Finance primero
  try {
    const yp = await marketService.getYahooPrice(symbol);
    return {
      symbol,
      price: yp.price,
      change: yp.change,
      changePercent: yp.changePercent,
      source: 'Yahoo Finance',
      type: assetType,
      timestamp: Date.now(),
    };
  } catch (yahooErr) {
    console.warn(`Yahoo price failed for ${symbol}, trying Finnhub:`, yahooErr);
  }

  // Fallback: Finnhub (puede dar 403 en plan gratuito para algunos símbolos)
  const stockQuote = await marketService.getStockQuote(symbol);
  return {
    symbol,
    price: stockQuote.price,
    change: stockQuote.change,
    changePercent: stockQuote.changePercent,
    source: 'Finnhub',
    type: assetType,
    timestamp: Date.now(),
  };
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

