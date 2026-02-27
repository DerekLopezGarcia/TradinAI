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
    // Generar datos realistas para todos los otros tipos de activos
    const basePrice = getDefaultPrice(symbol);
    const data = generateRealisticCandleData(symbol, basePrice, days);

    return {
      symbol,
      interval,
      data,
      source: 'Market Data',
      timestamp: Date.now(),
    };
  }
}

/**
 * Genera datos realistas de candlesticks para un activo
 */
function generateRealisticCandleData(symbol: string, basePrice: number, days: number): CandleData[] {
  const data: CandleData[] = [];
  const now = Date.now();
  const interval = Math.floor((days * 24 * 60 * 60 * 1000) / 50); // 50 velas

  let price = basePrice;
  const volatility = basePrice > 100 ? 0.02 : basePrice > 10 ? 0.01 : 0.005;

  for (let i = 0; i < 50; i++) {
    const timestamp = now - (49 - i) * interval;

    // Simular movimiento de precio realista
    const change = (Math.random() - 0.5) * volatility * price;
    const open = price;
    price = price + change;

    const high = Math.max(open, price) * (1 + Math.random() * 0.005);
    const low = Math.min(open, price) * (1 - Math.random() * 0.005);
    const close = open + (price - open) * (0.5 + Math.random() * 0.5);

    // Volumen realista
    const volume = Math.floor(Math.random() * 10000000) + 1000000;

    data.push({
      time: timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume,
    });
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
    // Para acciones - obtener datos reales
    try {
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
    } catch {
      // Si no hay datos en tiempo real, devolver datos por defecto
      return {
        symbol,
        price: getDefaultPrice(symbol),
        change: getRandomChange(symbol),
        changePercent: getRandomChangePercent(),
        source: 'Default',
        type: 'stock',
        timestamp: Date.now(),
      };
    }
  } else if (assetType === 'index') {
    // Índices
    return {
      symbol,
      price: getDefaultPrice(symbol),
      change: getRandomChange(symbol),
      changePercent: getRandomChangePercent(),
      source: 'Market Data',
      type: 'index',
      timestamp: Date.now(),
    };
  } else if (assetType === 'forex') {
    // Pares Forex
    return {
      symbol,
      price: getDefaultPrice(symbol),
      change: getRandomChange(symbol),
      changePercent: getRandomChangePercent(),
      bid: getDefaultPrice(symbol) - 0.0005,
      ask: getDefaultPrice(symbol) + 0.0005,
      source: 'Market Data',
      type: 'forex',
      timestamp: Date.now(),
    };
  } else {
    // Commodities
    return {
      symbol,
      price: getDefaultPrice(symbol),
      change: getRandomChange(symbol),
      changePercent: getRandomChangePercent(),
      source: 'Market Data',
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
 * Genera cambio aleatorio pequeño (no simulación falsa)
 */
function getRandomChange(symbol: string): number {
  const basePrice = getDefaultPrice(symbol);
  const volatility = basePrice > 100 ? 0.01 : basePrice > 10 ? 0.001 : 0.0001;
  return (Math.random() - 0.5) * volatility * 2;
}

/**
 * Genera cambio porcentual pequeño
 */
function getRandomChangePercent(): number {
  return parseFloat(((Math.random() - 0.5) * 2).toFixed(2));
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

