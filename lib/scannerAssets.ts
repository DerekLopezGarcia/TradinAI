/**
 * Definición centralizada de activos por categoría para el scanner
 * Importable desde cualquier parte de la aplicación
 */

export const ASSETS_BY_CATEGORY = {
  'Criptomonedas': [
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLBUSD', 'DOGEUSD', 'ADAUSD', 'POLYUSD', 'AVAXUSD', 'LINKUSD',
    'MATICUSD', 'LTCUSD', 'DOTUSD', 'ETCUSD', 'XMRUSD', 'DASHUSD', 'ZECUSD', 'XLMUSD', 'XTZUSD', 'COSMSUSD',
    'FILUSD', 'WAVESUSD', 'NEARUSD', 'ATOMUSD', 'ALGOUSD', 'VENDUSD', 'IOTAUSD', 'VETUSDUSD', 'HBARUSD', 'SFLUSD',
    'CHZUSD', 'SANDUSD', 'MANAUSD', 'ENSUSD', 'LUNAUSD', 'FTTUSD', 'SUIUSD', 'ARBUSD', 'OPTIMUSD', 'BASEUSD'
  ],
  'Forex Mayor': [
    'EURUSD', 'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
    'GBPUSD', 'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
    'JPYUSD', 'CHFJPY', 'CADJPY', 'AUDJPY', 'NZDJPY',
    'CHFUSD', 'CADUSD', 'AUDUSD', 'NZDUSD', 'SGDUSD', 'HKDUSD', 'NOKUSD',
    'BRLRSD', 'INRUSD', 'ZARUSD', 'MXNUSD', 'SEKUSD', 'DKKUSD'
  ],
  'Indices': [
    'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX',
    'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF',
    'RUSINDEX', 'MEXBOL', 'BOVESPA', 'KLCI', 'SET'
  ],
  'Commodities': [
    'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM',
    'OIL', 'GASOIL', 'NATGAS', 'BRENT', 'WTI',
    'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COCOA', 'COTTON',
    'LUMBER', 'NICKEL', 'ALUMINUM', 'ZINC', 'TIN', 'RICE'
  ],
  'Tecnologia': [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META',
    'NFLX', 'ADBE', 'INTC', 'AMD', 'QCOM', 'CSCO', 'ORCL', 'IBM',
    'CRM', 'SHOP', 'SQ', 'PYPL', 'TWLO', 'OKTA', 'DDOG',
    'BROADCOM', 'QCOM', 'NVDA', 'MRVL', 'MAXM',
    'SNAP', 'PINS', 'TWTR', 'DISC', 'RBLX', 'ZM', 'DOCU',
    'CRSR', 'RZR', 'LOGI'
  ],
  'Bancos': [
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SPG', 'PNC', 'USB', 'KEY',
    'HSBC', 'BARCLAYS', 'DBKR', 'BBVA', 'SAB', 'NVR'
  ],
  'Consumo': [
    'MCD', 'SBUX', 'WMT', 'TGT', 'KR', 'CVS', 'HD', 'LOW',
    'PG', 'KO', 'PEP', 'MDLZ', 'GIS', 'COST', 'CLX',
    'NKE', 'LULU', 'DECK', 'GXO'
  ],
  'Salud': [
    'JNJ', 'PFE', 'MRNA', 'BNTX', 'RHHBY', 'NOVAXUSD', 'REGN', 'BIIB',
    'AMGN', 'GILD', 'VRTX', 'BMRN', 'EXEL',
    'ABT', 'MDT', 'ISRG'
  ],
  'Energia': [
    'XOM', 'CVX', 'OKE', 'KMI', 'ENB', 'TC', 'MPC',
    'PLUG', 'ICLN', 'ADANIGREEN', 'NEONENERGY'
  ],
  'Inmobiliario': [
    'AMT', 'PLD', 'DLR', 'EQIX', 'ARE', 'WELL',
    'PHM', 'LEN', 'TOL', 'NVR', 'KBH'
  ],
  'Utilities': [
    'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'PCG', 'XEL'
  ],
  'Telecomunicaciones': [
    'VZ', 'T', 'TMUS', 'CMCSA', 'CHTR',
    'NTT', 'AKAM', 'NETSCOUT'
  ],
  'Industriales': [
    'BA', 'RTX', 'LMT', 'GE', 'HON', 'ITW', 'CARR',
    'CAT', 'PCAR', 'DE'
  ],
  'Materiales': [
    'FCX', 'NEM', 'SCCO', 'ALB', 'ARCATHON',
    'WRK', 'IP', 'PKG'
  ]
};

/**
 * Obtiene todas las categorías disponibles
 */
export function getCategories(): string[] {
  return Object.keys(ASSETS_BY_CATEGORY);
}

/**
 * Obtiene todos los activos de una categoría
 */
export function getAssetsByCategory(category: string): string[] {
  return ASSETS_BY_CATEGORY[category as keyof typeof ASSETS_BY_CATEGORY] || [];
}

/**
 * Obtiene todos los activos de todas las categorías
 */
export function getAllAssets(): string[] {
  return Object.values(ASSETS_BY_CATEGORY).flat();
}

/**
 * Obtiene la categoría de un activo
 */
export function getAssetCategory(symbol: string): string | undefined {
  for (const [category, assets] of Object.entries(ASSETS_BY_CATEGORY)) {
    if (assets.includes(symbol)) {
      return category;
    }
  }
  return undefined;
}

