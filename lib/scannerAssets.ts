/**
 * Definición centralizada de activos por categoría para el scanner
 * Sin duplicados - cada símbolo aparece una sola vez
 */

export const ASSETS_BY_CATEGORY = {
  // === CRIPTOMONEDAS (30) ===
  'Criptomonedas': [
    { symbol: 'BTCUSD', name: 'Bitcoin', description: 'Criptomoneda descentralizada' },
    { symbol: 'ETHUSD', name: 'Ethereum', description: 'Plataforma de contratos inteligentes' },
    { symbol: 'BNBUSD', name: 'Binance Coin', description: 'Token del exchange Binance' },
    { symbol: 'XRPUSD', name: 'Ripple', description: 'Red de pagos global' },
    { symbol: 'DOGEUSD', name: 'Dogecoin', description: 'Criptomoneda con meme' },
    { symbol: 'ADAUSD', name: 'Cardano', description: 'Blockchain académico' },
    { symbol: 'POLYUSD', name: 'Polygon', description: 'Layer 2 para Ethereum' },
    { symbol: 'AVAXUSD', name: 'Avalanche', description: 'Blockchain de consenso' },
    { symbol: 'LINKUSD', name: 'Chainlink', description: 'Oracle de datos cripto' },
    { symbol: 'MATICUSD', name: 'Matic', description: 'Solución de escalado' },
    { symbol: 'LTCUSD', name: 'Litecoin', description: 'Bitcoin para pagos' },
    { symbol: 'DOTUSD', name: 'Polkadot', description: 'Red multicadena' },
    { symbol: 'ETCUSD', name: 'Ethereum Classic', description: 'Blockchain original' },
    { symbol: 'XMRUSD', name: 'Monero', description: 'Privacidad garantizada' },
    { symbol: 'DASHUSD', name: 'Dash', description: 'Moneda de privacidad' },
    { symbol: 'ZECUSD', name: 'Zcash', description: 'Transacciones privadas' },
    { symbol: 'XLMUSD', name: 'Stellar', description: 'Red de pagos' },
    { symbol: 'XTZUSD', name: 'Tezos', description: 'Blockchain autoendurecible' },
    { symbol: 'FILUSD', name: 'Filecoin', description: 'Almacenamiento descentralizado' },
    { symbol: 'WAVESUSD', name: 'Waves', description: 'Plataforma blockchain' },
    { symbol: 'NEARUSD', name: 'Near Protocol', description: 'Blockchain escalable' },
    { symbol: 'ATOMUSD', name: 'Atom', description: 'Cosmos Hub token' },
    { symbol: 'ALGOUSD', name: 'Algorand', description: 'Blockchain de prueba' },
    { symbol: 'VETUSD', name: 'VeChain', description: 'Cadena de suministro' },
    { symbol: 'IOTAUSD', name: 'IOTA', description: 'IoT distribuido' },
    { symbol: 'HBARUSD', name: 'Hedera', description: 'Ledger distribuido' },
    { symbol: 'CHZUSD', name: 'Chiliz', description: 'Fan tokens deportivos' },
    { symbol: 'SANDUSD', name: 'Sandbox', description: 'Metaverso virtual' },
    { symbol: 'SUIUSD', name: 'Sui', description: 'Blockchain Move' },
    { symbol: 'ARBUSD', name: 'Arbitrum', description: 'Rollup Ethereum' },
  ],

  // === FOREX (31) ===
  'Forex': [
    { symbol: 'EURUSD', name: 'EUR/USD', description: 'Euro vs Dólar' },
    { symbol: 'EURGBP', name: 'EUR/GBP', description: 'Euro vs Libra' },
    { symbol: 'EURJPY', name: 'EUR/JPY', description: 'Euro vs Yen' },
    { symbol: 'EURCHF', name: 'EUR/CHF', description: 'Euro vs Franco' },
    { symbol: 'EURCAD', name: 'EUR/CAD', description: 'Euro vs Dólar canadiense' },
    { symbol: 'EURAUD', name: 'EUR/AUD', description: 'Euro vs Dólar australiano' },
    { symbol: 'EURNZD', name: 'EUR/NZD', description: 'Euro vs Dólar neozelandés' },
    { symbol: 'GBPUSD', name: 'GBP/USD', description: 'Libra vs Dólar' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', description: 'Libra vs Yen' },
    { symbol: 'GBPCHF', name: 'GBP/CHF', description: 'Libra vs Franco' },
    { symbol: 'GBPCAD', name: 'GBP/CAD', description: 'Libra vs Dólar canadiense' },
    { symbol: 'GBPAUD', name: 'GBP/AUD', description: 'Libra vs Dólar australiano' },
    { symbol: 'GBPNZD', name: 'GBP/NZD', description: 'Libra vs Dólar neozelandés' },
    { symbol: 'JPYUSD', name: 'JPY/USD', description: 'Yen vs Dólar' },
    { symbol: 'CHFJPY', name: 'CHF/JPY', description: 'Franco vs Yen' },
    { symbol: 'CADJPY', name: 'CAD/JPY', description: 'Dólar canadiense vs Yen' },
    { symbol: 'AUDJPY', name: 'AUD/JPY', description: 'Dólar australiano vs Yen' },
    { symbol: 'NZDJPY', name: 'NZD/JPY', description: 'Dólar neozelandés vs Yen' },
    { symbol: 'CHFUSD', name: 'CHF/USD', description: 'Franco vs Dólar' },
    { symbol: 'CADUSD', name: 'CAD/USD', description: 'Dólar canadiense vs Dólar' },
    { symbol: 'AUDUSD', name: 'AUD/USD', description: 'Dólar australiano vs Dólar' },
    { symbol: 'NZDUSD', name: 'NZD/USD', description: 'Dólar neozelandés vs Dólar' },
    { symbol: 'SGDUSD', name: 'SGD/USD', description: 'Dólar singapurense vs Dólar' },
    { symbol: 'HKDUSD', name: 'HKD/USD', description: 'Dólar hongkonés vs Dólar' },
    { symbol: 'NOKUSD', name: 'NOK/USD', description: 'Corona noruega vs Dólar' },
    { symbol: 'BRLUSD', name: 'BRL/USD', description: 'Real brasileño vs Dólar' },
    { symbol: 'INRUSD', name: 'INR/USD', description: 'Rupia india vs Dólar' },
    { symbol: 'ZARUSD', name: 'ZAR/USD', description: 'Rand sudafricano vs Dólar' },
    { symbol: 'MXNUSD', name: 'MXN/USD', description: 'Peso mexicano vs Dólar' },
    { symbol: 'SEKUSD', name: 'SEK/USD', description: 'Corona sueca vs Dólar' },
    { symbol: 'DKKUSD', name: 'DKK/USD', description: 'Corona danesa vs Dólar' },
  ],

  // === ÍNDICES (20 - Removido: RUSINDEX sin datos por sanciones) ===
  'Índices': [
    { symbol: 'SPX', name: 'S&P 500', description: 'Índice de 500 empresas' },
    { symbol: 'NDX', name: 'NASDAQ 100', description: 'Índice de tecnología' },
    { symbol: 'DXY', name: 'Dollar Index', description: 'Índice del dólar' },
    { symbol: 'VIX', name: 'Volatility Index', description: 'Índice de volatilidad' },
    { symbol: 'DAX', name: 'DAX', description: 'Índice alemán' },
    { symbol: 'FTSE', name: 'FTSE 100', description: 'Índice británico' },
    { symbol: 'CAC40', name: 'CAC 40', description: 'Índice francés' },
    { symbol: 'IBEX', name: 'IBEX 35', description: 'Índice español' },
    { symbol: 'MIB', name: 'FTSE MIB', description: 'Índice italiano' },
    { symbol: 'ASX', name: 'ASX 200', description: 'Índice australiano' },
    { symbol: 'NIKKEI', name: 'Nikkei 225', description: 'Índice japonés' },
    { symbol: 'HANGSENG', name: 'Hang Seng', description: 'Índice hongkonés' },
    { symbol: 'SHANGHAI', name: 'Shanghai Composite', description: 'Índice chino' },
    { symbol: 'SENSEX', name: 'Sensex 30', description: 'Índice indio' },
    { symbol: 'KOPSI', name: 'KOSPI', description: 'Índice surcoreano' },
    { symbol: 'SSETF', name: 'SSE Composite', description: 'Índice Shanghái' },
    { symbol: 'MEXBOL', name: 'IPC', description: 'Índice mexicano' },
    { symbol: 'BOVESPA', name: 'Bovespa', description: 'Índice brasileño' },
    { symbol: 'KLCI', name: 'KLCI', description: 'Índice malasio' },
    { symbol: 'SET', name: 'SET', description: 'Índice tailandés' },
  ],

  // === COMMODITIES & MATERIALES (15 - Removidos futuros a nueva categoría) ===
  'Commodities': [
    { symbol: 'GOLD', name: 'Oro', description: 'Metal precioso' },
    { symbol: 'SILVER', name: 'Plata', description: 'Metal industrial y precioso' },
    { symbol: 'COPPER', name: 'Cobre', description: 'Metal industrial' },
    { symbol: 'PLATINUM', name: 'Platino', description: 'Metal precioso' },
    { symbol: 'PALLADIUM', name: 'Paladio', description: 'Metal catalítico' },
    { symbol: 'NICKEL', name: 'Níquel', description: 'Metal industrial' },
    { symbol: 'ALUMINUM', name: 'Aluminio', description: 'Metal ligero' },
    { symbol: 'ZINC', name: 'Zinc', description: 'Metal industrial' },
    { symbol: 'FCX', name: 'Freeport-McMoran', description: 'Minería de cobre' },
    { symbol: 'NEM', name: 'Newmont Mining', description: 'Minería de oro' },
    { symbol: 'SCCO', name: 'Southern Copper', description: 'Productor de cobre' },
    { symbol: 'ALB', name: 'Albemarle', description: 'Litio y químicos' },
    { symbol: 'ARCH', name: 'Arch Resources', description: 'Carbón y recursos' },
    { symbol: 'WRK', name: 'Westrock', description: 'Papel y embalaje' },
    { symbol: 'IP', name: 'International Paper', description: 'Papel y embalaje' },
    { symbol: 'PKG', name: 'Packaging Corp', description: 'Embalaje corrugado' },
  ],

  // === FUTUROS (12 - Commodities futuros) ===
  'Futuros': [
    { symbol: 'CL', name: 'Petróleo Crudo WTI', description: 'Futuro de petróleo crudo (NYMEX)' },
    { symbol: 'BZ', name: 'Petróleo Brent', description: 'Futuro de petróleo Brent (ICE)' },
    { symbol: 'NG', name: 'Gas Natural', description: 'Futuro de gas natural (NYMEX)' },
    { symbol: 'ZW', name: 'Trigo', description: 'Futuro de trigo (CBOT)' },
    { symbol: 'ZC', name: 'Maíz', description: 'Futuro de maíz (CBOT)' },
    { symbol: 'ZS', name: 'Soja', description: 'Futuro de soja (CBOT)' },
    { symbol: 'SB', name: 'Azúcar', description: 'Futuro de azúcar (ICE)' },
    { symbol: 'KC', name: 'Café', description: 'Futuro de café arábica (ICE)' },
    { symbol: 'CC', name: 'Cacao', description: 'Futuro de cacao (ICE)' },
    { symbol: 'CT', name: 'Algodón', description: 'Futuro de algodón (ICE)' },
    { symbol: 'LBS', name: 'Madera', description: 'Futuro de madera (CBOT)' },
    { symbol: 'ES', name: 'E-mini S&P 500', description: 'Futuro de índice S&P 500 (CME)' },
  ],

  // === TECNOLOGÍA (32 - Removidos: GOOG duplicado) ===
  'Tecnología': [
    { symbol: 'AAPL', name: 'Apple', description: 'Electrónica de consumo' },
    { symbol: 'MSFT', name: 'Microsoft', description: 'Software y computación' },
    { symbol: 'GOOGL', name: 'Alphabet', description: 'Búsqueda e IA' },
    { symbol: 'AMZN', name: 'Amazon', description: 'E-commerce y nube' },
    { symbol: 'NVDA', name: 'NVIDIA', description: 'GPUs y chips' },
    { symbol: 'TSLA', name: 'Tesla', description: 'Vehículos eléctricos' },
    { symbol: 'META', name: 'Meta', description: 'Redes sociales y VR' },
    { symbol: 'NFLX', name: 'Netflix', description: 'Streaming de video' },
    { symbol: 'ADBE', name: 'Adobe', description: 'Software creativo' },
    { symbol: 'INTC', name: 'Intel', description: 'Procesadores y chips' },
    { symbol: 'AMD', name: 'AMD', description: 'Semiconductores' },
    { symbol: 'QCOM', name: 'Qualcomm', description: 'Semiconductores móviles' },
    { symbol: 'CSCO', name: 'Cisco', description: 'Equipos de red' },
    { symbol: 'ORCL', name: 'Oracle', description: 'Bases de datos' },
    { symbol: 'IBM', name: 'IBM', description: 'Soluciones de TI' },
    { symbol: 'CRM', name: 'Salesforce', description: 'Software CRM' },
    { symbol: 'SHOP', name: 'Shopify', description: 'Plataforma de e-commerce' },
    { symbol: 'SQ', name: 'Square', description: 'Pagos digitales' },
    { symbol: 'PYPL', name: 'PayPal', description: 'Pagos en línea' },
    { symbol: 'TWLO', name: 'Twilio', description: 'Comunicaciones en la nube' },
    { symbol: 'OKTA', name: 'Okta', description: 'Gestión de identidades' },
    { symbol: 'DDOG', name: 'Datadog', description: 'Monitoreo de infraestructura' },
    { symbol: 'BROADCOM', name: 'Broadcom', description: 'Semiconductores' },
    { symbol: 'MRVL', name: 'Marvell Tech', description: 'Semiconductores de datos' },
    { symbol: 'SNAP', name: 'Snap', description: 'Red social de fotos' },
    { symbol: 'PINS', name: 'Pinterest', description: 'Red social de imágenes' },
    { symbol: 'TWTR', name: 'Twitter/X', description: 'Red social' },
    { symbol: 'DISC', name: 'Discovery', description: 'Medios y entretenimiento' },
    { symbol: 'RBLX', name: 'Roblox', description: 'Plataforma de juegos' },
    { symbol: 'ZM', name: 'Zoom', description: 'Videoconferencia' },
    { symbol: 'DOCU', name: 'DocuSign', description: 'Firmas digitales' },
    { symbol: 'CRSR', name: 'Corsair', description: 'Componentes para gaming' },
    { symbol: 'LOGI', name: 'Logitech', description: 'Periféricos de computadora' },
  ],

  // === BANCOS (10 - Removidos: HSBC, BARCLAYS, DBKR, BBVA, SAB sin soporte en APIs) ===
  'Bancos': [
    { symbol: 'JPM', name: 'JPMorgan Chase', description: 'Banco de inversión' },
    { symbol: 'BAC', name: 'Bank of America', description: 'Banco comercial' },
    { symbol: 'WFC', name: 'Wells Fargo', description: 'Banco de servicios' },
    { symbol: 'GS', name: 'Goldman Sachs', description: 'Banco de inversión' },
    { symbol: 'MS', name: 'Morgan Stanley', description: 'Banco de inversión' },
    { symbol: 'BLK', name: 'BlackRock', description: 'Gestor de activos' },
    { symbol: 'SPG', name: 'Simon Property', description: 'REIT de centros comerciales' },
    { symbol: 'PNC', name: 'PNC Financial', description: 'Banco regional' },
    { symbol: 'USB', name: 'US Bancorp', description: 'Banco de servicios' },
    { symbol: 'KEY', name: 'KeyCorp', description: 'Banco regional' },
  ],

  // === CONSUMO (19) ===
  'Consumo': [
    { symbol: 'MCD', name: 'McDonald\'s', description: 'Comida rápida' },
    { symbol: 'SBUX', name: 'Starbucks', description: 'Café y bebidas' },
    { symbol: 'WMT', name: 'Walmart', description: 'Retail masivo' },
    { symbol: 'TGT', name: 'Target', description: 'Retail de descuento' },
    { symbol: 'KR', name: 'Kroger', description: 'Supermercados' },
    { symbol: 'CVS', name: 'CVS Health', description: 'Farmacia y retail' },
    { symbol: 'HD', name: 'Home Depot', description: 'Mejoras del hogar' },
    { symbol: 'LOW', name: 'Lowe\'s', description: 'Materiales de construcción' },
    { symbol: 'PG', name: 'Procter & Gamble', description: 'Productos de consumo' },
    { symbol: 'KO', name: 'Coca-Cola', description: 'Bebidas gaseosas' },
    { symbol: 'PEP', name: 'PepsiCo', description: 'Alimentos y bebidas' },
    { symbol: 'MDLZ', name: 'Mondelez', description: 'Snacks y confitería' },
    { symbol: 'GIS', name: 'General Mills', description: 'Alimentos procesados' },
    { symbol: 'COST', name: 'Costco', description: 'Almacén de membresía' },
    { symbol: 'CLX', name: 'Clorox', description: 'Productos químicos del hogar' },
    { symbol: 'NKE', name: 'Nike', description: 'Ropa y calzado deportivo' },
    { symbol: 'LULU', name: 'Lululemon', description: 'Ropa deportiva premium' },
    { symbol: 'DECK', name: 'Deckers', description: 'Ropa y calzado' },
    { symbol: 'GXO', name: 'GXO Logistics', description: 'Logística y distribución' },
  ],

  // === SALUD (16) ===
  'Salud': [
    { symbol: 'JNJ', name: 'Johnson & Johnson', description: 'Farmacéutica y dispositivos' },
    { symbol: 'PFE', name: 'Pfizer', description: 'Farmacéutica' },
    { symbol: 'MRNA', name: 'Moderna', description: 'Vacunas de ARN' },
    { symbol: 'BNTX', name: 'BioNTech', description: 'Biotecnología' },
    { symbol: 'RHHBY', name: 'Roche', description: 'Farmacéutica suiza' },
    { symbol: 'NVAX', name: 'Novavax', description: 'Desarrollo de vacunas' },
    { symbol: 'REGN', name: 'Regeneron', description: 'Biotecnología' },
    { symbol: 'BIIB', name: 'Biogen', description: 'Neurociencia' },
    { symbol: 'AMGN', name: 'Amgen', description: 'Biotecnología' },
    { symbol: 'GILD', name: 'Gilead Sciences', description: 'Antivirales' },
    { symbol: 'VRTX', name: 'Vertex Pharma', description: 'Fibrosis quística' },
    { symbol: 'BMRN', name: 'Biomarin Pharma', description: 'Enfermedades raras' },
    { symbol: 'EXEL', name: 'Exelixis', description: 'Oncología' },
    { symbol: 'ABT', name: 'Abbott Labs', description: 'Dispositivos de salud' },
    { symbol: 'MDT', name: 'Medtronic', description: 'Dispositivos médicos' },
    { symbol: 'ISRG', name: 'Intuitive Surgical', description: 'Robótica quirúrgica' },
  ],

  // === ENERGÍA (9) ===
  'Energía': [
    { symbol: 'XOM', name: 'ExxonMobil', description: 'Petróleo y gas' },
    { symbol: 'CVX', name: 'Chevron', description: 'Petróleo y gas' },
    { symbol: 'OKE', name: 'ONEOK', description: 'Transporte de gas' },
    { symbol: 'KMI', name: 'Kinder Morgan', description: 'Infraestructura de energía' },
    { symbol: 'ENB', name: 'Enbridge', description: 'Transporte de energía' },
    { symbol: 'TC', name: 'TransCanada', description: 'Tuberías de energía' },
    { symbol: 'MPC', name: 'Marathon Petroleum', description: 'Refinería de petróleo' },
    { symbol: 'PLUG', name: 'Plug Power', description: 'Celdas de combustible' },
    { symbol: 'ICLN', name: 'iClean ETF', description: 'Energía limpia' },
  ],

  // === INMOBILIARIO (11) ===
  'Inmobiliario': [
    { symbol: 'AMT', name: 'American Tower', description: 'Torres de telecomunicaciones' },
    { symbol: 'PLD', name: 'Prologis', description: 'Logística inmobiliaria' },
    { symbol: 'DLR', name: 'Digital Realty', description: 'Centros de datos' },
    { symbol: 'EQIX', name: 'Equinix', description: 'Infraestructura de TI' },
    { symbol: 'ARE', name: 'Alexandria Real Estate', description: 'Bienes raíces científicos' },
    { symbol: 'WELL', name: 'Welltower', description: 'Vivienda y salud' },
    { symbol: 'PHM', name: 'PulteGroup', description: 'Constructora de viviendas' },
    { symbol: 'LEN', name: 'Lennar', description: 'Construcción residencial' },
    { symbol: 'TOL', name: 'Toll Brothers', description: 'Vivienda de lujo' },
    { symbol: 'NVR', name: 'NVR Inc', description: 'Construcción de viviendas' },
    { symbol: 'KBH', name: 'KB Home', description: 'Constructor de casas' },
  ],

  // === UTILITIES (7) ===
  'Utilities': [
    { symbol: 'NEE', name: 'NextEra Energy', description: 'Servicios públicos de energía' },
    { symbol: 'DUK', name: 'Duke Energy', description: 'Servicios de energía' },
    { symbol: 'SO', name: 'Southern Company', description: 'Servicios eléctricos' },
    { symbol: 'AEP', name: 'American Electric Power', description: 'Servicios de energía' },
    { symbol: 'EXC', name: 'Exelon', description: 'Servicios de energía' },
    { symbol: 'PCG', name: 'PG&E', description: 'Gas y electricidad' },
    { symbol: 'XEL', name: 'Xcel Energy', description: 'Servicios de energía' },
  ],

  // === TELECOMUNICACIONES (6 - Removidos: NTT ADR Tokyo, NETSCOUT→NTCT) ===
  'Telecomunicaciones': [
    { symbol: 'VZ', name: 'Verizon', description: 'Telecomunicaciones móviles' },
    { symbol: 'T', name: 'AT&T', description: 'Telecomunicaciones' },
    { symbol: 'TMUS', name: 'T-Mobile', description: 'Telecomunicaciones inalámbricas' },
    { symbol: 'CMCSA', name: 'Comcast', description: 'Cable y medios' },
    { symbol: 'CHTR', name: 'Charter Communications', description: 'Cable de banda ancha' },
    { symbol: 'AKAM', name: 'Akamai', description: 'CDN y seguridad' },
  ],

  // === INDUSTRIALES (10) ===
  'Industriales': [
    { symbol: 'BA', name: 'Boeing', description: 'Aeronáutica y defensa' },
    { symbol: 'RTX', name: 'Raytheon', description: 'Defensa y espacio' },
    { symbol: 'LMT', name: 'Lockheed Martin', description: 'Defensa aeroespacial' },
    { symbol: 'GE', name: 'General Electric', description: 'Conglomerado industrial' },
    { symbol: 'HON', name: 'Honeywell', description: 'Sistemas de control' },
    { symbol: 'ITW', name: 'Illinois Tool Works', description: 'Equipos industriales' },
    { symbol: 'CARR', name: 'Carrier Global', description: 'HVAC y refrigeración' },
    { symbol: 'CAT', name: 'Caterpillar', description: 'Maquinaria de construcción' },
    { symbol: 'PCAR', name: 'PACCAR', description: 'Camiones y vehículos' },
    { symbol: 'DE', name: 'Deere & Company', description: 'Maquinaria agrícola' },
  ],
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
  const assets = ASSETS_BY_CATEGORY[category as keyof typeof ASSETS_BY_CATEGORY];
  if (!assets) return [];
  
  return assets.map((asset: any) => asset.symbol);
}

/**
 * Obtiene todos los activos de todas las categorías
 */
export function getAllAssets(): string[] {
  return Object.values(ASSETS_BY_CATEGORY)
    .flat()
    .map((asset: any) => typeof asset === 'object' ? asset.symbol : asset);
}

/**
 * Obtiene la categoría de un activo
 */
export function getAssetCategory(symbol: string): string | undefined {
  for (const [category, assets] of Object.entries(ASSETS_BY_CATEGORY)) {
    const symbols = Array.isArray(assets) && assets.length > 0 && typeof assets[0] === 'object'
      ? assets.map((a: any) => a.symbol)
      : assets;
    
    if (symbols.includes(symbol)) {
      return category;
    }
  }
  return undefined;
}

/**
 * Obtiene la descripción de un activo
 */
export function getAssetDescription(symbol: string): { name: string; description: string } | null {
  for (const assets of Object.values(ASSETS_BY_CATEGORY)) {
    if (Array.isArray(assets) && assets.length > 0 && typeof assets[0] === 'object') {
      const asset = assets.find((a: any) => a.symbol === symbol);
      if (asset) {
        return { name: asset.name, description: asset.description };
      }
    }
  }
  return null;
}

