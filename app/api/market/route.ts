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
  'SOLBUSD': 'solana',      // FIX: era SOLUSD
  'XRPUSD': 'ripple',
  'ADAUSD': 'cardano',
  'DOGEUSD': 'dogecoin',
  'DOTUSD': 'polkadot',      // FIX: era POLKAUSD (Polkadot es DOT)
  'LTCUSD': 'litecoin',      // FIX: era LITEUSD → LTCUSD

  // Criptos adicionales (T1.3+: Fix datos faltantes)
  'BNBUSD': 'binancecoin',
  'POLYUSD': 'polygon',
  'AVAXUSD': 'avalanche-2',
  'LINKUSD': 'chainlink',
  'MATICUSD': 'matic-network',
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
  'BRLUSD': 'BRL=X',
  'INRUSD': 'INR=X',
  'ZARUSD': 'ZAR=X',
  'MXNUSD': 'MXN=X',
  'SEKUSD': 'SEK=X',
  'DKKUSD': 'DKK=X',
};

/** Mapeo de símbolos Índices a formato Yahoo Finance */
const INDICES_SYMBOL_MAP: Record<string, string> = {
  // US
  'SPX': '^GSPC',      // S&P 500
  'NDX': '^IXIC',      // NASDAQ Composite
  'DXY': 'DX=F',       // Dollar Index
  'VIX': '^VIX',       // Volatility Index
  
  // Europa
  'DAX': '^GDAXI',     // Alemania
  'FTSE': '^FTSE',     // UK
  'CAC40': '^FCHI',    // Francia
  'IBEX': '^IBEX',     // España
  'MIB': '^FTSEMIB',   // Italia
  
  // Asia-Pacific
  'ASX': '^AXJO',      // Australia
  'NIKKEI': '^N225',   // Japón
  'HANGSENG': '^HSI',  // Hong Kong
  'SHANGHAI': '000001.SS', // China
  'SENSEX': '^BSESN',  // India
  'KOPSI': '^KS11',    // Corea del Sur
  'SSETF': '000001.SS', // Shanghai SSE
  'MEXBOL': '^MXX',    // México
  'BOVESPA': '^BVSP',  // Brasil
  'KLCI': '^KLSE',     // Malasia
  'SET': '^SET',       // Tailandia
};

/** Mapeo de símbolos Commodities a formato Yahoo Finance */
const COMMODITIES_SYMBOL_MAP: Record<string, string> = {
  // Metales
  'GOLD': 'GC=F',      // Oro (COMEX)
  'SILVER': 'SI=F',    // Plata (COMEX)
  'COPPER': 'HG=F',    // Cobre (COMEX)
  'PLATINUM': 'PL=F',  // Platino (NYMEX)
  'PALLADIUM': 'PA=F', // Paladio (NYMEX)
  
  // Metales industriales
  'NICKEL': 'NI=F',    // Níquel
  'ALUMINUM': 'ALI=F', // Aluminio
  'ZINC': 'ZN=F',      // Zinc
};

/** Mapeo de símbolos Futuros a formato Yahoo Finance (=F) */
const FUTURES_SYMBOL_MAP: Record<string, string> = {
  // Energía
  'CL': 'CL=F',      // Petróleo WTI (NYMEX)
  'BZ': 'BZ=F',      // Petróleo Brent (ICE)
  'NG': 'NG=F',      // Gas Natural (NYMEX)
  
  // Granos (CBOT)
  'ZW': 'ZWH=F',     // Trigo
  'ZC': 'ZCZ=F',     // Maíz
  'ZS': 'ZSZ=F',     // Soja
  
  // Suave (ICE)
  'SB': 'SB=F',      // Azúcar
  'KC': 'KC=F',      // Café
  'CC': 'CC=F',      // Cacao
  'CT': 'CT=F',      // Algodón
  
  // Madera (CBOT)
  'LBS': 'LBS=F',    // Madera
  
  // Índices (CME)
  'ES': 'ES=F',      // E-mini S&P 500
};

/** Símbolos de criptomonedas conocidas */
const CRYPTO_SYMBOLS = Object.keys(COINGECKO_IDS);

/** Símbolos de acciones */
const STOCK_SYMBOLS = new Set([
  // Tecnología
  'AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX', 'ADBE',
  'INTC', 'AMD', 'QCOM', 'CSCO', 'ORCL', 'IBM', 'CRM', 'SHOP', 'SQ', 'PYPL',
  
  // Bancos & Finanzas
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'PNC', 'USB', 'KEY', 'SPG',
  
  // Consumo & Retail
  'MCD', 'SBUX', 'WMT', 'TGT', 'KR', 'CVS', 'HD', 'LOW', 'PG', 'KO',
  'PEP', 'MDLZ', 'GIS', 'COST', 'CLX', 'NKE', 'LULU', 'DECK',
  
  // Salud
  'JNJ', 'PFE', 'MRNA', 'BNTX', 'NVAX', 'REGN', 'BIIB', 'AMGN', 'GILD',
  
  // Energía
  'XOM', 'CVX', 'OKE', 'KMI', 'ENB',
  
  // Industriales & Materials
  'BA', 'RTX', 'LMT', 'GE', 'HON', 'CAT', 'DE', 'ARCH', 'WRK',
  
  // Más commodities relacionados
  'FCX', 'NEM', 'AA', 'RS'
]);

/** Símbolos de índices */
const INDEX_SYMBOLS = new Set([
  // US
  'SPX', 'INDU', 'CCMP', 'VIX', 'DXY',
  
  // Europa
  'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB',
  
  // Asia-Pacific
  'ASX', 'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 
  
  // América Latina
  'MEXBOL', 'BOVESPA', 'KLCI', 'SET',
  'RUSINDEX'  // Rusia
]);

/** Símbolos de Forex */
const FOREX_SYMBOLS = new Set([
  'EURUSD', 'GBPUSD', 'JPYUSD', 'CHFUSD', 'AUDUSD', 'CADMXN'
]);

/** Símbolos de commodities */
const COMMODITY_SYMBOLS = new Set([
  // Metales Preciosos
  'XAUUSD', 'GOLD', 'XAGUSD', 'SILVER',
  
  // Metales Industriales
  'COPPER', 'XPTUSD', 'XPDUSD', 'NICKEL', 'ALUMINUM', 'ZINC', 'TIN', 'LEAD',
  
  // Energía
  'CRUDE', 'CL', 'BRENT', 'BZ', 'NATGAS', 'NG', 'HEATING_OIL', 'COAL',
  
  // Agrícola
  'WHEAT', 'ZW', 'CORN', 'ZC', 'SOYBEANS', 'ZS', 'SUGAR', 'SB', 'COFFEE', 'KC',
  'COCOA', 'CC', 'COTTON', 'CT', 'ORANGE_JUICE', 'OJ',
  
  // Otros
  'LUMBER', 'LBS', 'RUBBER'
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
    // Para índices, stocks, commodities, etc. - mapear a Yahoo Finance si es necesario
    const assetType = getAssetType(symbol);
    
    // ⚠️ DXY y MIB: Índices especiales sin datos fáciles de obtener
    if (['DXY', 'MIB'].includes(symbol)) {
      console.warn(`⚠️ ÍNDICE ESPECIAL: ${symbol} - Yahoo Finance no tiene datos para este símbolo`);
      console.log(`   Opciones: Usar símbolo alternativo o mostrar "Sin datos"`);
      throw new Error(`Índice ${symbol} no disponible en Yahoo Finance`);
    }
    
    let yahooSymbol = symbol;
    
    if (assetType === 'index') {
      yahooSymbol = INDICES_SYMBOL_MAP[symbol] || symbol;
      console.log(`📊 Index ${symbol} → Yahoo: ${yahooSymbol}`);
    } else if (assetType === 'forex') {
      yahooSymbol = FOREX_SYMBOL_MAP[symbol] || symbol;
    } else if (assetType === 'commodity') {
      yahooSymbol = COMMODITIES_SYMBOL_MAP[symbol] || symbol;
    }
    
    try {
      const data = await marketService.getStockHistory(yahooSymbol, interval, days);
      if (!data || data.length === 0) {
        throw new Error(`No hay datos históricos para ${symbol} (${yahooSymbol})`);
      }
      return { symbol, interval, data, source: 'Finnhub/Yahoo', isFallback: false, timestamp: Date.now() };
    } catch (mappedErr) {
      // Si el mapeo falla, intentar con el símbolo directo
      if (['DXY', 'MIB'].includes(symbol)) {
        console.log(`📊 Index ${symbol}: mapping falló, intentando símbolo directo`);
      }
      
      try {
        const data = await marketService.getStockHistory(symbol, interval, days);
        if (!data || data.length === 0) {
          throw new Error(`No hay datos históricos para ${symbol}`);
        }
        if (['DXY', 'MIB'].includes(symbol)) {
          console.log(`✅ Obtuvo ${data.length} candles para ${symbol}`);
        }
        return { symbol, interval, data, source: 'Finnhub/Yahoo', isFallback: false, timestamp: Date.now() };
      } catch (directErr) {
        throw new Error(`No hay datos históricos para ${symbol}`);
      }
    }
  }
}


/**
 * Obtiene noticias relacionadas al símbolo
 */
async function getNewsData(symbol: string) {
  let news;
  let source: string;

  if (isCrypto(symbol)) {
    news = await newsService.getCryptoNews(symbol, 10);
    source = 'Multi-fuente (Yahoo Finance, Alpha Vantage)';
  } else {
    news = await newsService.getStockNews(symbol, 7);
    source = 'Multi-fuente (Finnhub, Yahoo Finance, Alpha Vantage)';
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
      if (symbol === 'LTCUSD') {
        console.log(`💰 getPriceData: Intentando Binance para LTCUSD`);
      }
      const price = await binanceService.getCurrentPrice(symbol);
      const data24h = await binanceService.get24hData(symbol);
      if (symbol === 'LTCUSD') {
        console.log(`✅ Binance price para LTCUSD: ${price}`);
      }
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
      if (symbol === 'LTCUSD') {
        console.warn(`⚠️ Binance price failed para LTCUSD: ${binanceErr}, trying CoinGecko`);
      } else {
        console.warn(`Binance price failed for ${symbol}, trying CoinGecko:`, binanceErr);
      }
      // Fallback: CoinGecko
      try {
        // T1.3+: NO usar 'bitcoin' como default - rechazar si no está mapeado
        const coinId = COINGECKO_IDS[symbol];
        if (!coinId) {
          throw new Error(`No mapping in CoinGecko for ${symbol}`);
        }
        
        if (symbol === 'LTCUSD') {
          console.log(`🔄 CoinGecko: Intentando obtener price para LTCUSD (mapping: ${coinId})`);
        }
        
        const coinPrice = await marketService.getCoinPrice(coinId);
        
        if (symbol === 'LTCUSD') {
          console.log(`✅ CoinGecko price para LTCUSD: ${coinPrice.price}`);
        }
        
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

  // Stocks, índices, forex, commodities, futuros → Yahoo Finance primero

  // ⚠️ ÍNDICES ESPECIALES: DXY y MIB sin datos disponibles en Yahoo Finance
  if (['DXY', 'MIB'].includes(symbol)) {
    console.warn(`⚠️ ÍNDICE ESPECIAL: ${symbol} - Sin datos disponibles`);
    console.log(`   Razón: Yahoo Finance no soporta este símbolo`);
    throw new Error(`No data available for ${symbol}`);
  }
  
  try {
    // Fix: Mapear símbolos Forex, Índices, Commodities y Futuros a formato Yahoo Finance
    const yahooSymbol = FOREX_SYMBOL_MAP[symbol] || 
                        INDICES_SYMBOL_MAP[symbol] || 
                        COMMODITIES_SYMBOL_MAP[symbol] || 
                        FUTURES_SYMBOL_MAP[symbol] || 
                        symbol;
    
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

  // Fallback 2: Alpaca Markets (stocks con API key configurada)
  if (assetType === 'stock') {
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    if (apiKey && secretKey) {
      try {
        const res = await fetch(
          `https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`,
          {
            headers: {
              'APCA-API-KEY-ID': apiKey,
              'APCA-API-SECRET-KEY': secretKey,
            },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.trade?.p) {
            return {
              symbol,
              price: parseFloat(data.trade.p),
              change: 0,
              changePercent: 0,
              source: 'Alpaca',
              type: assetType,
              timestamp: Math.floor(data.trade.t / 1000000),
            };
          }
        }
      } catch {
        // silent
      }
    }
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
    // T1.5: Logging mejorado con detalles descriptivos
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Categorizar tipo de error para logging
    let errorType = 'UNKNOWN';
    if (errorMessage.includes('timeout') || errorMessage.includes('503') || errorMessage.includes('502')) {
      errorType = 'PROVIDER_UNAVAILABLE';
    } else if (errorMessage.includes('rate') || errorMessage.includes('429')) {
      errorType = 'RATE_LIMITED';
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
      errorType = 'INVALID_SYMBOL';
    } else if (errorMessage.includes('No data') || errorMessage.includes('No hay datos')) {
      errorType = 'NO_DATA_AVAILABLE';
    } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      errorType = 'NETWORK_ERROR';
    }

    console.error('Market API error:', {
      symbol,
      type,
      interval,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        symbol,
        type,
        timestamp: Date.now(),
        errorType,
        // T1.5: Proporcionar detalles en desarrollo y producción con categorización
        details: isDevelopment
          ? {
              message: errorMessage,
              type: errorType,
              suggestion: getErrorSuggestion(errorType, symbol),
            }
          : { type: errorType },
      },
      { status: 500 }
    );
  }
}

/**
 * T1.5: Obtiene sugerencia de solución según el tipo de error
 */
function getErrorSuggestion(errorType: string, symbol: string): string {
  const suggestions: Record<string, string> = {
    PROVIDER_UNAVAILABLE: 'El proveedor de datos no está disponible. Intenta de nuevo en unos minutos.',
    RATE_LIMITED: 'Se alcanzó el límite de solicitudes. Espera un momento antes de intentar de nuevo.',
    INVALID_SYMBOL: `"${symbol}" no es un símbolo válido. Verifica la ortografía.`,
    NO_DATA_AVAILABLE: `No hay datos disponibles para "${symbol}" en este momento.`,
    NETWORK_ERROR: 'Error de conexión de red. Verifica tu conexión a internet.',
    UNKNOWN: 'Error desconocido. Intenta de nuevo.',
  };
  return suggestions[errorType] || suggestions.UNKNOWN;
}
