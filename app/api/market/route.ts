import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/services/marketService';
import { newsService } from '@/lib/services/newsService';
import { binanceService } from '@/lib/services/binanceService';
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
  // Criptos principales (originales)
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'SOLUSD': 'solana',
  'XRPUSD': 'ripple',
  'ADAUSD': 'cardano',
  'DOGEUSD': 'dogecoin',
  'POLKAUSD': 'polkadot',
  'LITEUSD': 'litecoin',
  
  // Criptos adicionales (T1.3+: Fix datos faltantes)
  'BNBUSD': 'binancecoin',
  'POLYUSD': 'polygon',
  'AVAXUSD': 'avalanche-2',
  'LINKUSD': 'chainlink',
  'MATICUSD': 'matic-network',
  'DOTUSD': 'polkadot',
  'ETCUSD': 'ethereum-classic',
  'XMRUSD': 'monero',
  'DASHUSD': 'dash',
  'ZECUSD': 'zcash',
  'XLMUSD': 'stellar',
  'XTZUSD': 'tezos',
  'FILUSD': 'filecoin',
  'WAVESUSD': 'waves',
  'NEARUSD': 'near',
  'ATOMUSD': 'cosmos',
  'ALGOUSD': 'algorand',
  'VETUSD': 'vechain',
  'IOTAUSD': 'iota',
  'HBARUSD': 'hedera-hashgraph',
  'CHZUSD': 'chiliz',
  'SANDUSD': 'the-sandbox',
  'SUIUSD': 'sui',
  'ARBUSD': 'arbitrum',
};

/** Mapeo de símbolos Forex a formato Yahoo Finance */
const FOREX_SYMBOL_MAP: Record<string, string> = {
  'EURUSD': 'EURUSD=X',
  'EURGBP': 'EURGBP=X',
  'EURJPY': 'EURJPY=X',
  'EURCHF': 'EURCHF=X',
  'EURCAD': 'EURCAD=X',
  'EURAUD': 'EURAUD=X',
  'EURNZD': 'EURNZD=X',
  'GBPUSD': 'GBPUSD=X',
  'GBPJPY': 'GBPJPY=X',
  'GBPCHF': 'GBPCHF=X',
  'GBPCAD': 'GBPCAD=X',
  'GBPAUD': 'GBPAUD=X',
  'GBPNZD': 'GBPNZD=X',
  'JPYUSD': 'JPY=X',
  'CHFJPY': 'CHFJPY=X',
  'CADJPY': 'CADJPY=X',
  'AUDJPY': 'AUDJPY=X',
  'NZDJPY': 'NZDJPY=X',
  'CHFUSD': 'CHFUSD=X',
  'CADUSD': 'CADUSD=X',
  'AUDUSD': 'AUDUSD=X',
  'NZDUSD': 'NZDUSD=X',
  'SGDUSD': 'SGD=X',
  'HKDUSD': 'HKD=X',
  'NOKUSD': 'NOK=X',
  'BRLRSD': 'BRL=X',
  'INRUSD': 'INR=X',
  'ZARUSD': 'ZAR=X',
  'MXNUSD': 'MXN=X',
  'SEKUSD': 'SEK=X',
  'DKKUSD': 'DKK=X',
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
 * Para criptos usa Binance (mejor calidad de datos y sin rate limits restrictivos)
 * Para stocks usa Finnhub
 */
async function getHistoryData(symbol: string, interval: TimeFrame) {
  const days = getDaysByInterval(interval);

  if (isCrypto(symbol)) {
    try {
      // Proveedor principal: Binance (excelente calidad de velas)
      const data = await binanceService.getHistoricalCandles(symbol, interval);
      if (!data || data.length === 0) {
        throw new Error(`No hay datos en Binance para ${symbol}`);
      }
      return { symbol, interval, data, source: 'Binance', isFallback: false, timestamp: Date.now() };
    } catch (binanceErr) {
      console.warn(`Binance failed for ${symbol}, trying CoinGecko:`, binanceErr);
      // Fallback: CoinGecko
      try {
        const coinId = COINGECKO_IDS[symbol] || 'bitcoin';
        const data = await marketService.getCoinHistory(coinId, days, interval);
        if (!data || data.length === 0) {
          throw new Error(`No hay datos históricos para ${symbol}`);
        }
        return { symbol, interval, data, source: 'CoinGecko', isFallback: false, timestamp: Date.now() };
      } catch (coingeckoErr) {
        throw new Error(`No hay datos históricos disponibles para ${symbol}`);
      }
    }
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
 * Crypto → Binance (mejor liquidez y datos en tiempo real)
 * Todo lo demás → Yahoo Finance con fallback a Finnhub
 */
async function getPriceData(symbol: string) {
  const assetType = getAssetType(symbol);

  if (assetType === 'crypto') {
    try {
      // Proveedor principal: Binance
      const price = await binanceService.getCurrentPrice(symbol);
      const data24h = await binanceService.get24hData(symbol);
      return {
        symbol,
        price,
        change: parseFloat(data24h.priceChange || 0),
        changePercent: parseFloat(data24h.priceChangePercent || 0),
        marketCap: data24h.quoteAssetVolume ? parseFloat(data24h.quoteAssetVolume) : 0,
        volume24h: data24h.volume ? parseFloat(data24h.volume) : 0,
        source: 'Binance',
        type: 'crypto',
        timestamp: Date.now(),
      };
    } catch (binanceErr) {
      console.warn(`Binance price failed for ${symbol}, trying CoinGecko:`, binanceErr);
      // Fallback: CoinGecko
      try {
        // T1.3+: NO usar 'bitcoin' como default - rechazar si no está mapeado
        const coinId = COINGECKO_IDS[symbol];
        if (!coinId) {
          throw new Error(`No mapping in CoinGecko for ${symbol}`);
        }
        
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
      } catch (coingeckoErr) {
        throw new Error(`No se puede obtener precio para ${symbol} - Binance y CoinGecko fallaron`);
      }
    }
  }

  // Stocks, índices, forex, commodities → Yahoo Finance primero
  try {
    // Fix: Mapear símbolos Forex a formato Yahoo Finance
    const yahooSymbol = FOREX_SYMBOL_MAP[symbol] || symbol;
    const yp = await marketService.getYahooPrice(yahooSymbol);
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

