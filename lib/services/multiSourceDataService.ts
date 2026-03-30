import { CandleData, TimeFrame } from '@/lib/types';

/**
 * Servicio para obtener datos de múltiples APIs según tipo de activo
 * Soporta: Binance (crypto), CoinGecko (crypto), Yahoo Finance (acciones/forex/índices)
 */

type AssetType = 'crypto' | 'stock' | 'forex' | 'index' | 'commodity';

class MultiSourceDataService {
  private readonly coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTTL = 300000; // 5 minutos

  /**
   * Detecta el tipo de activo basado en el símbolo
   */
  private detectAssetType(symbol: string): AssetType {
    // Criptomonedas conocidas en Binance
    const cryptoSymbols = [
      'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLBUSD', 'DOGEUSD', 'ADAUSD', 'POLYUSD',
      'AVAXUSD', 'LINKUSD', 'MATICUSD', 'LTCUSD', 'DOTUSD', 'ETCUSD', 'XMRUSD', 'DASHUSD',
      'ZECUSD', 'XLMUSD', 'XTZUSD', 'COSMSUSD', 'FILUSD', 'WAVESUSD', 'NEARUSD', 'ATOMUSD',
      'ALGOUSD', 'VENDUSD', 'IOTAUSD', 'HBARUSD', 'SFLUSD', 'CHZUSD', 'SANDUSD', 'MANAUSD',
      'ENSUSD', 'LUNAUSD', 'FTTUSD', 'SUIUSD', 'ARBUSD', 'OPTIMUSD', 'BASEUSD'
    ];

    // Commodities
    const commodities = [
      'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'OIL', 'GASOIL', 'NATGAS',
      'BRENT', 'WTI', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COCOA', 'COTTON',
      'LUMBER', 'NICKEL', 'ALUMINUM', 'ZINC', 'TIN', 'RICE'
    ];

    // Índices
    const indices = [
      'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX',
      'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 'RUSINDEX',
      'MEXBOL', 'BOVESPA', 'KLCI', 'SET'
    ];

    // Forex
    const forexPairs = [
      'EURUSD', 'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
      'GBPUSD', 'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
      'JPYUSD', 'CHFJPY', 'CADJPY', 'AUDJPY', 'NZDJPY',
      'CHFUSD', 'CADUSD', 'AUDUSD', 'NZDUSD', 'SGDUSD', 'HKDUSD', 'NOKUSD',
      'BRLRSD', 'INRUSD', 'ZARUSD', 'MXNUSD', 'SEKUSD', 'DKKUSD'
    ];

    if (cryptoSymbols.includes(symbol)) return 'crypto';
    if (commodities.includes(symbol)) return 'commodity';
    if (indices.includes(symbol)) return 'index';
    if (forexPairs.includes(symbol)) return 'forex';

    return 'stock'; // default
  }

  /**
   * Obtiene datos históricos usando la fuente correcta según el tipo de activo
   */
  async getHistoricalCandles(symbol: string, interval: TimeFrame): Promise<CandleData[]> {
    const type = this.detectAssetType(symbol);
    const cacheKey = `${symbol}:${interval}:${type}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    let candles: CandleData[] = [];

    try {
      switch (type) {
        case 'crypto':
          candles = await this.getCryptoPrices(symbol, interval);
          break;
        case 'commodity':
        case 'stock':
        case 'forex':
        case 'index':
          // Para estos tipos, intentar obtener de API proxy
          candles = await this.getFromProxyAPI(symbol, interval);
          break;
      }

      if (candles.length > 0) {
        this.cache.set(cacheKey, {
          data: candles,
          timestamp: Date.now(),
        });
      }

      return candles;
    } catch (error) {
      console.error(`Error obteniendo datos para ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Obtiene datos de criptomonedas usando CoinGecko (fallback)
   */
  private async getCryptoPrices(symbol: string, _interval: TimeFrame): Promise<CandleData[]> {
    const cryptoMap: Record<string, string> = {
      'BTCUSD': 'bitcoin',
      'ETHUSD': 'ethereum',
      'BNBUSD': 'binancecoin',
      'XRPUSD': 'ripple',
      'SOLBUSD': 'solana',
      'DOGEUSD': 'dogecoin',
      'ADAUSD': 'cardano',
      'POLYUSD': 'polygon',
      'AVAXUSD': 'avalanche-2',
      'LINKUSD': 'chainlink',
      'MATICUSD': 'matic-network',
      'LTCUSD': 'litecoin',
      'DOTUSD': 'polkadot',
    };

    const cryptoId = cryptoMap[symbol];
    if (!cryptoId) return [];

    try {
      const response = await fetch(
        `${this.coinGeckoBaseUrl}/coins/${cryptoId}/ohlc?vs_currency=usd&days=7`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) return [];

      const data = await response.json();

      if (!Array.isArray(data)) return [];

      return data.map((candle: number[]) => ({
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Obtiene datos del endpoint proxy del servidor
   * Que a su vez consulta servicios externos
   */
  private async getFromProxyAPI(symbol: string, interval: TimeFrame): Promise<CandleData[]> {
    try {
      const response = await fetch(
        `/api/market/candles?symbol=${symbol}&interval=${interval}&type=${this.detectAssetType(symbol)}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.candles || [];
    } catch {
      return [];
    }
  }
}

export const multiSourceDataService = new MultiSourceDataService();

