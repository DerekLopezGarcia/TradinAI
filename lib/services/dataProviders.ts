/**
 * Implementaciones específicas de proveedores de datos
 * Cada proveedor es independiente y escalable
 */

import { TimeFrame } from '@/lib/types';
import {
  IDataProvider,
  CandleData,
  AssetType,
  SYMBOL_CONFIG,
  getMappedSymbol
} from './dataProviderFactory';

// ============================================================================
// PROVEEDOR: BINANCE (Crypto)
// ============================================================================

export class BinanceProvider implements IDataProvider {
  name = 'Binance';
  priority = 100; // Máxima prioridad para crypto
  supportsTypes: AssetType[] = ['crypto'];
  supportsSymbols = SYMBOL_CONFIG.crypto;

  canHandle(symbol: string, type: AssetType): boolean {
    return type === 'crypto' && this.supportsSymbols.has(symbol);
  }

  async fetch(symbol: string, interval: string): Promise<CandleData[]> {
    // Usa el binanceService existente
    const { binanceService } = await import('./binanceService');
    return binanceService.getHistoricalCandles(symbol, interval as TimeFrame);
  }
}

// ============================================================================
// PROVEEDOR: COINGECKO (Crypto fallback)
// ============================================================================

export class CoinGeckoProvider implements IDataProvider {
  name = 'CoinGecko';
  priority = 80; // Fallback para crypto
  supportsTypes: AssetType[] = ['crypto'];
  supportsSymbols = SYMBOL_CONFIG.crypto;

  canHandle(symbol: string, type: AssetType): boolean {
    return type === 'crypto' && this.supportsSymbols.has(symbol);
  }

  async fetch(symbol: string, _interval: string): Promise<CandleData[]> {
    const geckoId = getMappedSymbol(symbol, 'coinGecko');
    if (!geckoId) {
      if (symbol === 'LTCUSD') console.warn(`⚠️ CoinGecko: No mapping para ${symbol}`);
      return [];
    }

    try {
      if (symbol === 'LTCUSD') {
        console.log(`🔄 CoinGecko: Intentando obtener LTCUSD (mapping: ${geckoId})`);
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${geckoId}/ohlc?vs_currency=usd&days=7`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        if (symbol === 'LTCUSD') {
          console.warn(`⚠️ CoinGecko: Status ${response.status} para LTCUSD`);
        }
        return [];
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        if (symbol === 'LTCUSD') console.warn(`⚠️ CoinGecko: Respuesta no es array para LTCUSD`);
        return [];
      }

      const candles = data.map((candle: number[]) => ({
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0,
      })).filter((c: CandleData) => !isNaN(c.open) && !isNaN(c.close));

      if (symbol === 'LTCUSD' && candles.length > 0) {
        console.log(`✅ CoinGecko: Obtuvo ${candles.length} candles para LTCUSD`);
      }

      return candles;
    } catch (error) {
      if (symbol === 'LTCUSD') {
        console.warn(`❌ CoinGecko error para LTCUSD: ${error instanceof Error ? error.message : String(error)}`);
      }
      return [];
    }
  }
}

// ============================================================================
// PROVEEDOR: TWELVE DATA (Stocks e Índices)
// ============================================================================

export class TwelveDataProvider implements IDataProvider {
  name = 'Twelve Data';
  priority = 90; // Máxima prioridad para stocks e índices
  supportsTypes: AssetType[] = ['stock', 'index'];
  supportsSymbols = new Set([
    ...SYMBOL_CONFIG.stock,
    ...SYMBOL_CONFIG.index
  ]);

  private apiKey = process.env.TWELVE_DATA_API_KEY;

  canHandle(symbol: string, type: AssetType): boolean {
    return !!(this.apiKey && (type === 'stock' || type === 'index') && this.supportsSymbols.has(symbol));
  }

  async fetch(symbol: string, _interval: string): Promise<CandleData[]> {
    if (!this.apiKey) return [];

    const mappedSymbol = getMappedSymbol(symbol, 'twelveData');
    const response = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${mappedSymbol}&interval=1h&outputsize=200&format=JSON&apikey=${this.apiKey}`,
      { 
        headers: { 'User-Agent': 'TradingIA' },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    if (data.status === 'error' || !data.values?.length) return [];

    return data.values.reverse().map((candle: { datetime: string; open: string; high: string; low: string; close: string; volume: string }) => ({
      time: new Date(candle.datetime).getTime(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume) || 0,
    })).filter((c: CandleData) => !isNaN(c.open) && !isNaN(c.close));
  }
}

// ============================================================================
// PROVEEDOR: YAHOO FINANCE (Stocks e Índices fallback)
// ============================================================================

export class YahooFinanceProvider implements IDataProvider {
  name = 'Yahoo Finance';
  priority = 70; // Fallback para stocks e índices
  supportsTypes: AssetType[] = ['stock', 'index'];
  supportsSymbols = new Set([
    ...SYMBOL_CONFIG.stock,
    ...SYMBOL_CONFIG.index
  ]);

  canHandle(symbol: string, type: AssetType): boolean {
    return (type === 'stock' || type === 'index') && this.supportsSymbols.has(symbol);
  }

  async fetch(symbol: string, _interval: string): Promise<CandleData[]> {
    const mappedSymbol = getMappedSymbol(symbol, 'yahooFinance') || 
                        (symbol.endsWith('USD') ? symbol.replace('USD', '') : symbol);

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${mappedSymbol}?interval=1h&range=1mo`,
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const timestamps = data.chart?.result?.[0]?.timestamp || [];
    const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0] || {};

    if (!timestamps?.length) return [];

    return timestamps.map((ts: number, idx: number) => ({
      time: ts * 1000,
      open: quotes.open?.[idx] || 0,
      high: quotes.high?.[idx] || 0,
      low: quotes.low?.[idx] || 0,
      close: quotes.close?.[idx] || 0,
      volume: quotes.volume?.[idx] || 0,
    })).filter((c: CandleData) => !isNaN(c.close) && c.close > 0);
  }
}

// ============================================================================
// PROVEEDOR: QUANDL (Commodities)
// ============================================================================

export class QuandlProvider implements IDataProvider {
  name = 'Quandl';
  priority = 90; // Máxima prioridad para commodities
  supportsTypes: AssetType[] = ['commodity'];
  supportsSymbols = SYMBOL_CONFIG.commodity;

  private apiKey = process.env.QUANDL_API_KEY;

  canHandle(symbol: string, type: AssetType): boolean {
    return !!(this.apiKey && type === 'commodity' && this.supportsSymbols.has(symbol));
  }

  async fetch(symbol: string, _interval: string): Promise<CandleData[]> {
    if (!this.apiKey) return [];

    const dataset = getMappedSymbol(symbol, 'quandl');
    if (!dataset) return [];

    const response = await fetch(
      `https://www.quandl.com/api/v3/datasets/${dataset}/data.json?limit=200&api_key=${this.apiKey}`
    );

    if (!response.ok) return [];
    const data = await response.json();
    const rows = data.data || [];

    if (!rows.length) return [];

    // Quandl retorna datos en orden inverso (más reciente primero)
    return rows.map((row: string[]) => {
      const [date, open, high, low, close, volume] = row;
      return {
        time: new Date(date).getTime(),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume) || 0,
      };
    }).filter((c: CandleData) => !isNaN(c.close) && c.close > 0);
  }
}

// ============================================================================
// PROVEEDOR: ALPACA MARKETS (Stocks e Índices)
// ============================================================================

export class AlpacaProvider implements IDataProvider {
  name = 'Alpaca Markets';
  priority = 85; // Entre TwelveData (90) y YahooFinance (70)
  supportsTypes: AssetType[] = ['stock', 'index'];
  supportsSymbols = new Set([
    ...SYMBOL_CONFIG.stock,
    ...SYMBOL_CONFIG.index
  ]);

  private apiKey = process.env.ALPACA_API_KEY;
  private secretKey = process.env.ALPACA_SECRET_KEY;

  canHandle(symbol: string, type: AssetType): boolean {
    return !!(this.apiKey && this.secretKey && (type === 'stock' || type === 'index') && this.supportsSymbols.has(symbol));
  }

  async fetch(symbol: string, interval: string): Promise<CandleData[]> {
    if (!this.apiKey || !this.secretKey) return [];

    const tfMap: Record<string, string> = {
      '1m': '1Min', '5m': '5Min', '15m': '15Min',
      '1h': '1Hour', '4h': '4Hour', '1d': '1Day', '1w': '1Week',
    };
    const alpacaInterval = tfMap[interval] || '1Hour';

    try {
      const response = await fetch(
        `https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=${alpacaInterval}&limit=200&adjustment=split`,
        {
          headers: {
            'APCA-API-KEY-ID': this.apiKey,
            'APCA-API-SECRET-KEY': this.secretKey,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) return [];
      const data = await response.json();
      if (!data.bars?.length) return [];

      return data.bars.map((bar: { t: string; o: string; h: string; l: string; c: string; v: string }) => ({
        time: new Date(bar.t).getTime(),
        open: parseFloat(bar.o),
        high: parseFloat(bar.h),
        low: parseFloat(bar.l),
        close: parseFloat(bar.c),
        volume: parseFloat(bar.v) || 0,
      })).filter((c: CandleData) => !isNaN(c.close) && c.close > 0);
    } catch {
      return [];
    }
  }
}



