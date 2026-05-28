/**
 * Centralized asset definitions by category for the scanner
 * No duplicates - each symbol appears only once
 */

export const ASSETS_BY_CATEGORY = {
  // === CRIPTOMONEDAS (30) ===
  'Criptomonedas': [
    { symbol: 'BTCUSD', name: 'Bitcoin', description: 'Decentralized cryptocurrency' },
    { symbol: 'ETHUSD', name: 'Ethereum', description: 'Smart contract platform' },
    { symbol: 'BNBUSD', name: 'Binance Coin', description: 'Binance exchange token' },
    { symbol: 'XRPUSD', name: 'Ripple', description: 'Global payment network' },
    { symbol: 'DOGEUSD', name: 'Dogecoin', description: 'Meme cryptocurrency' },
    { symbol: 'ADAUSD', name: 'Cardano', description: 'Academic blockchain' },
    { symbol: 'POLYUSD', name: 'Polygon', description: 'Ethereum Layer 2' },
    { symbol: 'AVAXUSD', name: 'Avalanche', description: 'Consensus blockchain' },
    { symbol: 'LINKUSD', name: 'Chainlink', description: 'Crypto data oracle' },
    { symbol: 'MATICUSD', name: 'Matic', description: 'Scaling solution' },
    { symbol: 'LTCUSD', name: 'Litecoin', description: 'Bitcoin for payments' },
    { symbol: 'DOTUSD', name: 'Polkadot', description: 'Multi-chain network' },
    { symbol: 'ETCUSD', name: 'Ethereum Classic', description: 'Original blockchain' },
    { symbol: 'XMRUSD', name: 'Monero', description: 'Guaranteed privacy' },
    { symbol: 'DASHUSD', name: 'Dash', description: 'Privacy coin' },
    { symbol: 'ZECUSD', name: 'Zcash', description: 'Private transactions' },
    { symbol: 'XLMUSD', name: 'Stellar', description: 'Payment network' },
    { symbol: 'XTZUSD', name: 'Tezos', description: 'Self-amending blockchain' },
    { symbol: 'FILUSD', name: 'Filecoin', description: 'Decentralized storage' },
    { symbol: 'WAVESUSD', name: 'Waves', description: 'Blockchain platform' },
    { symbol: 'NEARUSD', name: 'Near Protocol', description: 'Scalable blockchain' },
    { symbol: 'ATOMUSD', name: 'Atom', description: 'Cosmos Hub token' },
    { symbol: 'ALGOUSD', name: 'Algorand', description: 'Proof-of-stake blockchain' },
    { symbol: 'VETUSD', name: 'VeChain', description: 'Supply chain' },
    { symbol: 'IOTAUSD', name: 'IOTA', description: 'Distributed IoT' },
    { symbol: 'HBARUSD', name: 'Hedera', description: 'Distributed ledger' },
    { symbol: 'CHZUSD', name: 'Chiliz', description: 'Sports fan tokens' },
    { symbol: 'SANDUSD', name: 'Sandbox', description: 'Virtual metaverse' },
    { symbol: 'SUIUSD', name: 'Sui', description: 'Move-based blockchain' },
    { symbol: 'ARBUSD', name: 'Arbitrum', description: 'Ethereum rollup' },
  ],

  // === FOREX (31) ===
  'Forex': [
    { symbol: 'EURUSD', name: 'EUR/USD', description: 'Euro vs Dollar' },
    { symbol: 'EURGBP', name: 'EUR/GBP', description: 'Euro vs Pound' },
    { symbol: 'EURJPY', name: 'EUR/JPY', description: 'Euro vs Yen' },
    { symbol: 'EURCHF', name: 'EUR/CHF', description: 'Euro vs Franc' },
    { symbol: 'EURCAD', name: 'EUR/CAD', description: 'Euro vs Canadian Dollar' },
    { symbol: 'EURAUD', name: 'EUR/AUD', description: 'Euro vs Australian Dollar' },
    { symbol: 'EURNZD', name: 'EUR/NZD', description: 'Euro vs NZ Dollar' },
    { symbol: 'GBPUSD', name: 'GBP/USD', description: 'Pound vs Dollar' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', description: 'Pound vs Yen' },
    { symbol: 'GBPCHF', name: 'GBP/CHF', description: 'Pound vs Franc' },
    { symbol: 'GBPCAD', name: 'GBP/CAD', description: 'Pound vs Canadian Dollar' },
    { symbol: 'GBPAUD', name: 'GBP/AUD', description: 'Pound vs Australian Dollar' },
    { symbol: 'GBPNZD', name: 'GBP/NZD', description: 'Pound vs NZ Dollar' },
    { symbol: 'JPYUSD', name: 'JPY/USD', description: 'Yen vs Dollar' },
    { symbol: 'CHFJPY', name: 'CHF/JPY', description: 'Franc vs Yen' },
    { symbol: 'CADJPY', name: 'CAD/JPY', description: 'Canadian Dollar vs Yen' },
    { symbol: 'AUDJPY', name: 'AUD/JPY', description: 'Australian Dollar vs Yen' },
    { symbol: 'NZDJPY', name: 'NZD/JPY', description: 'NZ Dollar vs Yen' },
    { symbol: 'CHFUSD', name: 'CHF/USD', description: 'Franc vs Dollar' },
    { symbol: 'CADUSD', name: 'CAD/USD', description: 'Canadian Dollar vs Dollar' },
    { symbol: 'AUDUSD', name: 'AUD/USD', description: 'Australian Dollar vs Dollar' },
    { symbol: 'NZDUSD', name: 'NZD/USD', description: 'NZ Dollar vs Dollar' },
    { symbol: 'SGDUSD', name: 'SGD/USD', description: 'Singapore Dollar vs Dollar' },
    { symbol: 'HKDUSD', name: 'HKD/USD', description: 'Hong Kong Dollar vs Dollar' },
    { symbol: 'NOKUSD', name: 'NOK/USD', description: 'Norwegian Krone vs Dollar' },
    { symbol: 'BRLUSD', name: 'BRL/USD', description: 'Brazilian Real vs Dollar' },
    { symbol: 'INRUSD', name: 'INR/USD', description: 'Indian Rupee vs Dollar' },
    { symbol: 'ZARUSD', name: 'ZAR/USD', description: 'South African Rand vs Dollar' },
    { symbol: 'MXNUSD', name: 'MXN/USD', description: 'Mexican Peso vs Dollar' },
    { symbol: 'SEKUSD', name: 'SEK/USD', description: 'Swedish Krona vs Dollar' },
    { symbol: 'DKKUSD', name: 'DKK/USD', description: 'Danish Krone vs Dollar' },
  ],

  // === ÍNDICES (20 - Removido: RUSINDEX sin datos por sanciones) ===
  'Índices': [
    { symbol: 'SPX', name: 'S&P 500', description: '500 largest US companies index' },
    { symbol: 'NDX', name: 'NASDAQ 100', description: 'Technology index' },
    { symbol: 'DXY', name: 'Dollar Index', description: 'US Dollar index' },
    { symbol: 'VIX', name: 'Volatility Index', description: 'Volatility index' },
    { symbol: 'DAX', name: 'DAX', description: 'German index' },
    { symbol: 'FTSE', name: 'FTSE 100', description: 'British index' },
    { symbol: 'CAC40', name: 'CAC 40', description: 'French index' },
    { symbol: 'IBEX', name: 'IBEX 35', description: 'Spanish index' },
    { symbol: 'MIB', name: 'FTSE MIB', description: 'Italian index' },
    { symbol: 'ASX', name: 'ASX 200', description: 'Australian index' },
    { symbol: 'NIKKEI', name: 'Nikkei 225', description: 'Japanese index' },
    { symbol: 'HANGSENG', name: 'Hang Seng', description: 'Hong Kong index' },
    { symbol: 'SHANGHAI', name: 'Shanghai Composite', description: 'Chinese index' },
    { symbol: 'SENSEX', name: 'Sensex 30', description: 'Indian index' },
    { symbol: 'KOPSI', name: 'KOSPI', description: 'South Korean index' },
    { symbol: 'SSETF', name: 'SSE Composite', description: 'Shanghai index' },
    { symbol: 'MEXBOL', name: 'IPC', description: 'Mexican index' },
    { symbol: 'BOVESPA', name: 'Bovespa', description: 'Brazilian index' },
    { symbol: 'KLCI', name: 'KLCI', description: 'Malaysian index' },
    { symbol: 'SET', name: 'SET', description: 'Thai index' },
  ],

  // === COMMODITIES & MATERIALES (15 - Removidos futuros a nueva categoría) ===
  'Commodities': [
    { symbol: 'GOLD', name: 'Gold', description: 'Precious metal' },
    { symbol: 'SILVER', name: 'Silver', description: 'Industrial and precious metal' },
    { symbol: 'COPPER', name: 'Copper', description: 'Industrial metal' },
    { symbol: 'PLATINUM', name: 'Platinum', description: 'Precious metal' },
    { symbol: 'PALLADIUM', name: 'Palladium', description: 'Catalytic metal' },
    { symbol: 'NICKEL', name: 'Nickel', description: 'Industrial metal' },
    { symbol: 'ALUMINUM', name: 'Aluminum', description: 'Lightweight metal' },
    { symbol: 'ZINC', name: 'Zinc', description: 'Industrial metal' },
    { symbol: 'FCX', name: 'Freeport-McMoran', description: 'Copper mining' },
    { symbol: 'NEM', name: 'Newmont Mining', description: 'Gold mining' },
    { symbol: 'SCCO', name: 'Southern Copper', description: 'Copper producer' },
    { symbol: 'ALB', name: 'Albemarle', description: 'Lithium and chemicals' },
    { symbol: 'ARCH', name: 'Arch Resources', description: 'Coal and resources' },
    { symbol: 'WRK', name: 'Westrock', description: 'Paper and packaging' },
    { symbol: 'IP', name: 'International Paper', description: 'Paper and packaging' },
    { symbol: 'PKG', name: 'Packaging Corp', description: 'Corrugated packaging' },
  ],

  // === FUTUROS (12 - Commodities futuros) ===
  'Futuros': [
    { symbol: 'CL', name: 'WTI Crude Oil', description: 'Crude oil future (NYMEX)' },
    { symbol: 'BZ', name: 'Brent Crude Oil', description: 'Brent crude oil future (ICE)' },
    { symbol: 'NG', name: 'Natural Gas', description: 'Natural gas future (NYMEX)' },
    { symbol: 'ZW', name: 'Wheat', description: 'Wheat future (CBOT)' },
    { symbol: 'ZC', name: 'Corn', description: 'Corn future (CBOT)' },
    { symbol: 'ZS', name: 'Soybean', description: 'Soybean future (CBOT)' },
    { symbol: 'SB', name: 'Sugar', description: 'Sugar future (ICE)' },
    { symbol: 'KC', name: 'Coffee', description: 'Arabica coffee future (ICE)' },
    { symbol: 'CC', name: 'Cocoa', description: 'Cocoa future (ICE)' },
    { symbol: 'CT', name: 'Cotton', description: 'Cotton future (ICE)' },
    { symbol: 'LBS', name: 'Lumber', description: 'Lumber future (CBOT)' },
    { symbol: 'ES', name: 'E-mini S&P 500', description: 'S&P 500 index future (CME)' },
  ],

  // === TECNOLOGÍA (32 - Removidos: GOOG duplicado) ===
  'Tecnología': [
    { symbol: 'AAPL', name: 'Apple', description: 'Consumer electronics' },
    { symbol: 'MSFT', name: 'Microsoft', description: 'Software and computing' },
    { symbol: 'GOOGL', name: 'Alphabet', description: 'Search and AI' },
    { symbol: 'AMZN', name: 'Amazon', description: 'E-commerce and cloud' },
    { symbol: 'NVDA', name: 'NVIDIA', description: 'GPUs and chips' },
    { symbol: 'TSLA', name: 'Tesla', description: 'Electric vehicles' },
    { symbol: 'META', name: 'Meta', description: 'Social media and VR' },
    { symbol: 'NFLX', name: 'Netflix', description: 'Video streaming' },
    { symbol: 'ADBE', name: 'Adobe', description: 'Creative software' },
    { symbol: 'INTC', name: 'Intel', description: 'Processors and chips' },
    { symbol: 'AMD', name: 'AMD', description: 'Semiconductors' },
    { symbol: 'QCOM', name: 'Qualcomm', description: 'Mobile semiconductors' },
    { symbol: 'CSCO', name: 'Cisco', description: 'Network equipment' },
    { symbol: 'ORCL', name: 'Oracle', description: 'Databases' },
    { symbol: 'IBM', name: 'IBM', description: 'IT solutions' },
    { symbol: 'CRM', name: 'Salesforce', description: 'CRM software' },
    { symbol: 'SHOP', name: 'Shopify', description: 'E-commerce platform' },
    { symbol: 'SQ', name: 'Square', description: 'Digital payments' },
    { symbol: 'PYPL', name: 'PayPal', description: 'Online payments' },
    { symbol: 'TWLO', name: 'Twilio', description: 'Cloud communications' },
    { symbol: 'OKTA', name: 'Okta', description: 'Identity management' },
    { symbol: 'DDOG', name: 'Datadog', description: 'Infrastructure monitoring' },
    { symbol: 'BROADCOM', name: 'Broadcom', description: 'Semiconductors' },
    { symbol: 'MRVL', name: 'Marvell Tech', description: 'Data semiconductors' },
    { symbol: 'SNAP', name: 'Snap', description: 'Photo social network' },
    { symbol: 'PINS', name: 'Pinterest', description: 'Image social network' },
    { symbol: 'TWTR', name: 'Twitter/X', description: 'Social network' },
    { symbol: 'DISC', name: 'Discovery', description: 'Media and entertainment' },
    { symbol: 'RBLX', name: 'Roblox', description: 'Gaming platform' },
    { symbol: 'ZM', name: 'Zoom', description: 'Video conferencing' },
    { symbol: 'DOCU', name: 'DocuSign', description: 'Digital signatures' },
    { symbol: 'CRSR', name: 'Corsair', description: 'Gaming components' },
    { symbol: 'LOGI', name: 'Logitech', description: 'Computer peripherals' },
  ],

  // === BANCOS (10 - Removidos: HSBC, BARCLAYS, DBKR, BBVA, SAB sin soporte en APIs) ===
  'Bancos': [
    { symbol: 'JPM', name: 'JPMorgan Chase', description: 'Investment bank' },
    { symbol: 'BAC', name: 'Bank of America', description: 'Commercial bank' },
    { symbol: 'WFC', name: 'Wells Fargo', description: 'Financial services' },
    { symbol: 'GS', name: 'Goldman Sachs', description: 'Investment bank' },
    { symbol: 'MS', name: 'Morgan Stanley', description: 'Investment bank' },
    { symbol: 'BLK', name: 'BlackRock', description: 'Asset manager' },
    { symbol: 'SPG', name: 'Simon Property', description: 'Shopping mall REIT' },
    { symbol: 'PNC', name: 'PNC Financial', description: 'Regional bank' },
    { symbol: 'USB', name: 'US Bancorp', description: 'Financial services' },
    { symbol: 'KEY', name: 'KeyCorp', description: 'Regional bank' },
  ],

  // === CONSUMO (19) ===
  'Consumo': [
    { symbol: 'MCD', name: 'McDonald\'s', description: 'Fast food' },
    { symbol: 'SBUX', name: 'Starbucks', description: 'Coffee and beverages' },
    { symbol: 'WMT', name: 'Walmart', description: 'Mass retail' },
    { symbol: 'TGT', name: 'Target', description: 'Discount retail' },
    { symbol: 'KR', name: 'Kroger', description: 'Supermarkets' },
    { symbol: 'CVS', name: 'CVS Health', description: 'Pharmacy and retail' },
    { symbol: 'HD', name: 'Home Depot', description: 'Home improvement' },
    { symbol: 'LOW', name: 'Lowe\'s', description: 'Building materials' },
    { symbol: 'PG', name: 'Procter & Gamble', description: 'Consumer products' },
    { symbol: 'KO', name: 'Coca-Cola', description: 'Soft drinks' },
    { symbol: 'PEP', name: 'PepsiCo', description: 'Food and beverages' },
    { symbol: 'MDLZ', name: 'Mondelez', description: 'Snacks and confectionery' },
    { symbol: 'GIS', name: 'General Mills', description: 'Processed foods' },
    { symbol: 'COST', name: 'Costco', description: 'Membership warehouse' },
    { symbol: 'CLX', name: 'Clorox', description: 'Household chemical products' },
    { symbol: 'NKE', name: 'Nike', description: 'Sportswear and footwear' },
    { symbol: 'LULU', name: 'Lululemon', description: 'Premium sportswear' },
    { symbol: 'DECK', name: 'Deckers', description: 'Clothing and footwear' },
    { symbol: 'GXO', name: 'GXO Logistics', description: 'Logistics and distribution' },
  ],

  // === SALUD (16) ===
  'Salud': [
    { symbol: 'JNJ', name: 'Johnson & Johnson', description: 'Pharmaceuticals and devices' },
    { symbol: 'PFE', name: 'Pfizer', description: 'Pharmaceuticals' },
    { symbol: 'MRNA', name: 'Moderna', description: 'RNA vaccines' },
    { symbol: 'BNTX', name: 'BioNTech', description: 'Biotechnology' },
    { symbol: 'RHHBY', name: 'Roche', description: 'Swiss pharmaceuticals' },
    { symbol: 'NVAX', name: 'Novavax', description: 'Vaccine development' },
    { symbol: 'REGN', name: 'Regeneron', description: 'Biotechnology' },
    { symbol: 'BIIB', name: 'Biogen', description: 'Neuroscience' },
    { symbol: 'AMGN', name: 'Amgen', description: 'Biotechnology' },
    { symbol: 'GILD', name: 'Gilead Sciences', description: 'Antivirals' },
    { symbol: 'VRTX', name: 'Vertex Pharma', description: 'Cystic fibrosis' },
    { symbol: 'BMRN', name: 'Biomarin Pharma', description: 'Rare diseases' },
    { symbol: 'EXEL', name: 'Exelixis', description: 'Oncology' },
    { symbol: 'ABT', name: 'Abbott Labs', description: 'Health devices' },
    { symbol: 'MDT', name: 'Medtronic', description: 'Medical devices' },
    { symbol: 'ISRG', name: 'Intuitive Surgical', description: 'Surgical robotics' },
  ],

  // === ENERGÍA (9) ===
  'Energía': [
    { symbol: 'XOM', name: 'ExxonMobil', description: 'Oil and gas' },
    { symbol: 'CVX', name: 'Chevron', description: 'Oil and gas' },
    { symbol: 'OKE', name: 'ONEOK', description: 'Gas transportation' },
    { symbol: 'KMI', name: 'Kinder Morgan', description: 'Energy infrastructure' },
    { symbol: 'ENB', name: 'Enbridge', description: 'Energy transportation' },
    { symbol: 'TC', name: 'TransCanada', description: 'Energy pipelines' },
    { symbol: 'MPC', name: 'Marathon Petroleum', description: 'Oil refinery' },
    { symbol: 'PLUG', name: 'Plug Power', description: 'Fuel cells' },
    { symbol: 'ICLN', name: 'iClean ETF', description: 'Clean energy' },
  ],

  // === INMOBILIARIO (11) ===
  'Inmobiliario': [
    { symbol: 'AMT', name: 'American Tower', description: 'Telecom towers' },
    { symbol: 'PLD', name: 'Prologis', description: 'Real estate logistics' },
    { symbol: 'DLR', name: 'Digital Realty', description: 'Data centers' },
    { symbol: 'EQIX', name: 'Equinix', description: 'IT infrastructure' },
    { symbol: 'ARE', name: 'Alexandria Real Estate', description: 'Science real estate' },
    { symbol: 'WELL', name: 'Welltower', description: 'Housing and health' },
    { symbol: 'PHM', name: 'PulteGroup', description: 'Home builder' },
    { symbol: 'LEN', name: 'Lennar', description: 'Residential construction' },
    { symbol: 'TOL', name: 'Toll Brothers', description: 'Luxury housing' },
    { symbol: 'NVR', name: 'NVR Inc', description: 'Home construction' },
    { symbol: 'KBH', name: 'KB Home', description: 'Home builder' },
  ],

  // === UTILITIES (7) ===
  'Utilities': [
    { symbol: 'NEE', name: 'NextEra Energy', description: 'Energy utilities' },
    { symbol: 'DUK', name: 'Duke Energy', description: 'Energy services' },
    { symbol: 'SO', name: 'Southern Company', description: 'Electric services' },
    { symbol: 'AEP', name: 'American Electric Power', description: 'Energy services' },
    { symbol: 'EXC', name: 'Exelon', description: 'Energy services' },
    { symbol: 'PCG', name: 'PG&E', description: 'Gas and electricity' },
    { symbol: 'XEL', name: 'Xcel Energy', description: 'Energy services' },
  ],

  // === TELECOMUNICACIONES (6 - Removidos: NTT ADR Tokyo, NETSCOUT→NTCT) ===
  'Telecomunicaciones': [
    { symbol: 'VZ', name: 'Verizon', description: 'Mobile telecommunications' },
    { symbol: 'T', name: 'AT&T', description: 'Telecommunications' },
    { symbol: 'TMUS', name: 'T-Mobile', description: 'Wireless telecommunications' },
    { symbol: 'CMCSA', name: 'Comcast', description: 'Cable and media' },
    { symbol: 'CHTR', name: 'Charter Communications', description: 'Broadband cable' },
    { symbol: 'AKAM', name: 'Akamai', description: 'CDN and security' },
  ],

  // === INDUSTRIALES (10) ===
  'Industriales': [
    { symbol: 'BA', name: 'Boeing', description: 'Aerospace and defense' },
    { symbol: 'RTX', name: 'Raytheon', description: 'Defense and space' },
    { symbol: 'LMT', name: 'Lockheed Martin', description: 'Aerospace defense' },
    { symbol: 'GE', name: 'General Electric', description: 'Industrial conglomerate' },
    { symbol: 'HON', name: 'Honeywell', description: 'Control systems' },
    { symbol: 'ITW', name: 'Illinois Tool Works', description: 'Industrial equipment' },
    { symbol: 'CARR', name: 'Carrier Global', description: 'HVAC and refrigeration' },
    { symbol: 'CAT', name: 'Caterpillar', description: 'Construction machinery' },
    { symbol: 'PCAR', name: 'PACCAR', description: 'Trucks and vehicles' },
    { symbol: 'DE', name: 'Deere & Company', description: 'Agricultural machinery' },
  ],
};

/**
 * Gets all available categories
 */
export function getCategories(): string[] {
  return Object.keys(ASSETS_BY_CATEGORY);
}

/**
 * Gets all assets of a category
 */
export function getAssetsByCategory(category: string): string[] {
  const assets = ASSETS_BY_CATEGORY[category as keyof typeof ASSETS_BY_CATEGORY];
  if (!assets) return [];
  
  return assets.map((asset: { symbol: string }) => asset.symbol);
}

/**
 * Gets all assets from all categories
 */
export function getAllAssets(): string[] {
  return Object.values(ASSETS_BY_CATEGORY)
    .flat()
    .map((asset: { symbol: string }) => asset.symbol);
}

/**
 * Gets the category of an asset
 */
export function getAssetCategory(symbol: string): string | undefined {
  for (const [category, assets] of Object.entries(ASSETS_BY_CATEGORY)) {
    if (!Array.isArray(assets)) continue;
    const symbols = (assets as { symbol: string }[]).map(a => a.symbol);
    
    if (symbols.includes(symbol)) {
      return category;
    }
  }
  return undefined;
}

/**
 * Gets the description of an asset
 */
export function getAssetDescription(symbol: string): { name: string; description: string } | null {
  for (const assets of Object.values(ASSETS_BY_CATEGORY)) {
    if (!Array.isArray(assets) || assets.length === 0) continue;
    const asset = (assets as { symbol: string; name: string; description: string }[]).find(a => a.symbol === symbol);
    if (asset) {
      return { name: asset.name, description: asset.description };
    }
  }
  return null;
}

