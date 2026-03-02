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
// Función removida - ya no se necesita

// ==================== MANEJADORES DE TIPOS DE DATOS ====================

/**
 * Obtiene datos históricos (candlesticks)
 */
async function getHistoryData(symbol: string, interval: TimeFrame) {
  const days = getDaysByInterval(interval);

  try {
    if (isCrypto(symbol)) {
      const coinId = COINGECKO_IDS[symbol] || 'bitcoin';
      const data = await marketService.getCoinHistory(coinId, days);

      if (data && data.length > 0) {
        return {
          symbol,
          interval,
          data,
          source: 'CoinGecko',
          timestamp: Date.now(),
        };
      }
    } else {
      // Obtener datos reales de Finnhub para acciones, índices, forex, etc
      const data = await marketService.getStockHistory(symbol, interval, days);

      if (data && data.length > 0) {
        return {
          symbol,
          interval,
          data,
          source: 'Finnhub',
          timestamp: Date.now(),
        };
      }
    }
  } catch (error) {
    console.error('Error fetching real data:', error);
  }

  // Fallback: Generar datos cuando las APIs fallan
  console.warn(`Generating fallback data for ${symbol} interval ${interval}`);
  const fallbackData = generateFallbackCandleData(symbol, days, interval);
  return {
    symbol,
    interval,
    data: fallbackData,
    source: 'Fallback',
    timestamp: Date.now(),
  };
}

/**
 * Genera datos fallback realistas para velas cuando las APIs no responden
 * Ajusta el número de velas según el timeframe
 */
function generateFallbackCandleData(symbol: string, days: number, interval: TimeFrame = '1d'): CandleData[] {
  const data: CandleData[] = [];
  const now = Date.now();
  const basePrice = getDefaultPrice(symbol);

  // Volatilidad realista según el tipo de activo
  const volatility = basePrice > 100 ? 0.02 : basePrice > 10 ? 0.01 : 0.005;

  let price = basePrice;

  // Calcular número de velas según el intervalo
  let numCandles = 50;
  let intervalMs = 24 * 60 * 60 * 1000; // 1 día por defecto

  switch (interval) {
    case '1m':
      numCandles = Math.min(60, days * 24 * 60); // Máx 60 velas de 1 minuto
      intervalMs = 60 * 1000; // 1 minuto
      break;
    case '5m':
      numCandles = Math.min(100, days * 24 * 12); // Máx 100 velas de 5 minutos
      intervalMs = 5 * 60 * 1000; // 5 minutos
      break;
    case '15m':
      numCandles = Math.min(100, days * 24 * 4); // Máx 100 velas de 15 minutos
      intervalMs = 15 * 60 * 1000; // 15 minutos
      break;
    case '1h':
      numCandles = Math.min(100, days * 24); // Máx 100 velas de 1 hora
      intervalMs = 60 * 60 * 1000; // 1 hora
      break;
    case '4h':
      numCandles = Math.min(100, days * 6); // Máx 100 velas de 4 horas
      intervalMs = 4 * 60 * 60 * 1000; // 4 horas
      break;
    case '1d':
      numCandles = Math.min(100, days); // Máx 100 velas diarias
      intervalMs = 24 * 60 * 60 * 1000; // 1 día
      break;
    case '1w':
      numCandles = Math.min(52, Math.ceil(days / 7)); // Máx 52 velas semanales
      intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 semana
      break;
  }

  for (let i = 0; i < numCandles; i++) {
    const timestamp = now - (numCandles - 1 - i) * intervalMs;

    // Cambio pequeño y realista
    const change = (Math.random() - 0.5) * volatility * price * 2;
    const open = price;
    const close = Math.max(price + change, basePrice * 0.8);

    // High y low con rangos pequeños y realistas
    const high = Math.max(open, close) * (1 + Math.abs(change) / (basePrice * 0.1));
    const low = Math.min(open, close) * (1 - Math.abs(change) / (basePrice * 0.1));

    // Volumen realista
    const volume = Math.floor(5000000 + Math.random() * 10000000);

    data.push({
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return data;
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
  } else if (assetType === 'stock') {
    // Para acciones - obtener datos reales o retornar error
    const stockQuote = await marketService.getStockQuote(symbol);
    return {
      symbol,
      price: stockQuote.price,
      change: stockQuote.change,
      changePercent: stockQuote.changePercent,
      bid: stockQuote.bid,
      ask: stockQuote.ask,
      source: 'Finnhub',
      type: 'stock',
      timestamp: Date.now(),
    };
  } else if (assetType === 'index') {
    // Índices - intentar obtener datos reales
    const stockQuote = await marketService.getStockQuote(symbol);
    return {
      symbol,
      price: stockQuote.price,
      change: stockQuote.change,
      changePercent: stockQuote.changePercent,
      source: 'Finnhub',
      type: 'index',
      timestamp: Date.now(),
    };
  } else if (assetType === 'forex') {
    // Pares Forex - obtener datos reales o error
    const stockQuote = await marketService.getStockQuote(symbol);
    return {
      symbol,
      price: stockQuote.price,
      change: stockQuote.change,
      changePercent: stockQuote.changePercent,
      bid: stockQuote.bid,
      ask: stockQuote.ask,
      source: 'Finnhub',
      type: 'forex',
      timestamp: Date.now(),
    };
  } else {
    // Commodities - obtener datos reales o error
    const stockQuote = await marketService.getStockQuote(symbol);
    return {
      symbol,
      price: stockQuote.price,
      change: stockQuote.change,
      changePercent: stockQuote.changePercent,
      source: 'Finnhub',
      type: 'commodity',
      timestamp: Date.now(),
    };
  }
}

/**
 * Obtiene precio por defecto basado en el símbolo
 */
function getDefaultPrice(symbol: string): number {
  const prices: Record<string, number> = {
    // Acciones
    'AAPL': 192.35, 'GOOGL': 138.42, 'TSLA': 242.84, 'MSFT': 420.15,
    'AMZN': 185.42, 'META': 485.95, 'NVDA': 876.50,
    'JPM': 197.35, 'BAC': 35.42, 'GS': 414.25,
    'BA': 184.50, 'CAT': 342.15, 'MMM': 95.25,
    // Índices
    'SPX': 5328.75, 'INDU': 42525.50, 'CCMP': 19285.25, 'VIX': 18.42,
    // Forex
    'EURUSD': 1.0945, 'GBPUSD': 1.2685, 'JPYUSD': 0.00645,
    'CHFUSD': 1.1245, 'AUDUSD': 0.6585, 'CADMXN': 17.25,
    // Commodities
    'XAUUSD': 2385.50, 'XAGUSD': 28.95, 'XPTUSD': 1035.25,
    'XPDUSD': 985.50, 'COPPER': 4.25, 'CRUDE': 82.45, 'NATGAS': 3.15,
  };
  return prices[symbol] || 100;
}

/**
 * Obtiene cambio desde datos reales (no aleatorio)
 */
function getRandomChange(symbol: string): number {
  // Solo retornar 0 - los cambios deben venir de datos reales de APIs
  return 0;
}

/**
 * Obtiene cambio porcentual desde datos reales (no aleatorio)
 */
function getRandomChangePercent(): number {
  // Solo retornar 0 - los cambios deben venir de datos reales de APIs
  return 0;
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

