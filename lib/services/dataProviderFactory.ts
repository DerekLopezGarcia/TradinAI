/**
 * Data Provider Factory Pattern
 * Abstracción centralizada para diferentes fuentes de datos
 * Permite agregar/remover/modificar proveedores sin cambiar el código de routing
 */

export type AssetType = 'crypto' | 'stock' | 'forex' | 'index' | 'commodity';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DataProviderResult {
  candles: CandleData[];
  source: string;
  isFallback: boolean;
  timestamp: number;
}

export interface IDataProvider {
  name: string;
  priority: number; // Mayor prioridad = se intenta primero
  supportsTypes: AssetType[];
  supportsSymbols: Set<string>;
  
  canHandle(symbol: string, type: AssetType): boolean;
  fetch(symbol: string, interval: string): Promise<CandleData[]>;
}

// ============================================================================
// CONFIGURACIÓN CENTRALIZADA DE MAPEOS DE SÍMBOLOS
// ============================================================================

export const SYMBOL_CONFIG = {
  crypto: new Set([
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLBUSD', 'DOGEUSD', 'ADAUSD',
    'POLYUSD', 'AVAXUSD', 'LINKUSD', 'MATICUSD', 'LTCUSD', 'DOTUSD', 'ETCUSD',
  ]),
  
  index: new Set([
    'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 
    'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'MEXBOL', 'BOVESPA'
  ]),
  
  forex: new Set([
    'EURUSD', 'GBPUSD', 'JPYUSD', 'CHFUSD', 'CADUSD', 'AUDUSD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD'
  ]),
  
  commodity: new Set([
    'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'OIL', 'NATGAS', 'WHEAT', 'CORN'
  ]),
  
  stock: new Set([
    // Tecnología
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'ADBE',
    'INTC', 'AMD', 'QCOM', 'CSCO', 'ORCL', 'IBM', 'CRM', 'SHOP', 'SQ', 'PYPL',
    // Bancos
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'PNC', 'USB', 'KEY', 'SPG',
    // Consumo
    'MCD', 'SBUX', 'WMT', 'TGT', 'KR', 'CVS', 'HD', 'LOW', 'PG', 'KO',
    'PEP', 'MDLZ', 'GIS', 'COST', 'CLX', 'NKE', 'LULU', 'DECK',
    // Salud
    'JNJ', 'PFE', 'MRNA', 'BNTX', 'NVAX', 'REGN', 'BIIB', 'AMGN', 'GILD',
    // Energía
    'XOM', 'CVX', 'OKE', 'KMI', 'ENB',
    // Industriales
    'BA', 'RTX', 'LMT', 'GE', 'HON', 'CAT', 'DE'
  ])
};

export const SYMBOL_MAPPINGS = {
  // Mapeos para Twelve Data (stocks e índices)
  twelveData: {
    ...Object.fromEntries([...SYMBOL_CONFIG.stock].map(s => [s, s])),
    'SPX': '^GSPC', 'NDX': '^IXIC', 'DXY': '^DXY', 'VIX': '^VIX',
    'DAX': '^GDAXI', 'FTSE': '^FTSE', 'CAC40': '^FCHI', 'IBEX': '^IBEX',
    'NIKKEI': '^N225', 'HANGSENG': '^HSI'
  },
  
  // Mapeos para Yahoo Finance
  yahooFinance: {
    'SPX': '^GSPC', 'NDX': '^IXIC', 'DXY': '^DXY', 'VIX': '^VIX',
    'DAX': '^GDAXI', 'FTSE': '^FTSE', 'CAC40': '^FCHI', 'IBEX': '^IBEX',
    'NIKKEI': '^N225', 'HANGSENG': '^HSI', 'MIB': 'FTSEMIB.MI',
    'MEXBOL': '^MXX', 'BOVESPA': '^BVSP'
  },
  
  // Mapeos para CoinGecko (crypto)
  coinGecko: {
    'BTCUSD': 'bitcoin', 'ETHUSD': 'ethereum', 'BNBUSD': 'binancecoin',
    'XRPUSD': 'ripple', 'SOLBUSD': 'solana', 'DOGEUSD': 'dogecoin',
    'ADAUSD': 'cardano', 'POLYUSD': 'polygon', 'AVAXUSD': 'avalanche-2',
    'LINKUSD': 'chainlink', 'MATICUSD': 'matic-network', 'LTCUSD': 'litecoin',
    'DOTUSD': 'polkadot', 'ETCUSD': 'ethereum-classic'
  },
  
  // Mapeos para Quandl (commodities)
  quandl: {
    'GOLD': 'LBMA/GOLD', 'SILVER': 'LBMA/SILVER', 'COPPER': 'CHRIS/COMEX_CL',
    'PLATINUM': 'LPPM/PLATINUM', 'OIL': 'CHRIS/COMEX_CL', 'NATGAS': 'CHRIS/NYMEX_NG',
    'WHEAT': 'CHRIS/CBOT_ZW', 'CORN': 'CHRIS/CBOT_ZC'
  }
};

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

export function detectAssetType(symbol: string): AssetType {
  for (const [type, symbols] of Object.entries(SYMBOL_CONFIG)) {
    if (symbols.has(symbol)) return type as AssetType;
  }
  return 'stock';
}

export function getMappedSymbol(symbol: string, provider: 'twelveData' | 'yahooFinance' | 'coinGecko' | 'quandl'): string {
  return SYMBOL_MAPPINGS[provider][symbol as keyof typeof SYMBOL_MAPPINGS[typeof provider]] || symbol;
}

export function isValidSymbol(symbol: string, type: AssetType): boolean {
  return SYMBOL_CONFIG[type].has(symbol);
}

export class DataProviderManager {
  private providers: IDataProvider[] = [];

  register(provider: IDataProvider) {
    this.providers.push(provider);
    this.providers.sort((a, b) => b.priority - a.priority); // Ordenar por prioridad descendente
  }

  getProviders(symbol: string, type: AssetType): IDataProvider[] {
    return this.providers.filter(p => p.canHandle(symbol, type));
  }

  async fetchFromProviders(
    symbol: string,
    type: AssetType,
    interval: string,
    maxRetries: number = 3
  ): Promise<DataProviderResult | null> {
    const providers = this.getProviders(symbol, type);
    
    if (providers.length === 0) {
      console.warn(`❌ No providers available for ${symbol} (${type})`);
      return null;
    }

    for (const provider of providers) {
      try {
        console.log(`🔄 Attempting ${provider.name} for ${symbol}...`);
        const candles = await Promise.race([
          provider.fetch(symbol, interval),
          new Promise<CandleData[]>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ]);

        if (candles && candles.length > 0) {
          console.log(`✅ ${provider.name}: ${candles.length} candles for ${symbol}`);
          return {
            candles,
            source: provider.name,
            isFallback: provider !== providers[0],
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.warn(`⚠️ ${provider.name} failed: ${error}`);
        continue;
      }
    }

    console.warn(`❌ All providers failed for ${symbol}`);
    return null;
  }
}

// Instancia global del gestor
export const providerManager = new DataProviderManager();

