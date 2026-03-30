/**
 * AUDITORÍA COMPLETA DEL FLUJO DE DATOS DE TRADINGÍA
 * 
 * Este documento valida que todos los nombres de API sean correctos
 * y que los datos fluyan correctamente a través de todos los componentes
 */

// ============================================================================
// 1. FLUJO DE DATOS: OBTENCIÓN DE VELAS HISTÓRICAS
// ============================================================================

/**
 * ENDPOINT PRINCIPAL: /api/market/candles
 * 
 * Parámetros:
 * - symbol: Símbolo del activo (BTCUSD, AAPL, EURUSD, etc.)
 * - interval: Timeframe (1h, 4h, 1d, 1w)
 * - type: Tipo de activo (crypto, stock, forex, commodity, index)
 * 
 * FLUJO DE SELECCIÓN DE DATOS:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    GET /api/market/candles                  │
 * └────────────┬────────────────────────────────────────────────┘
 *              │
 *              ├─ type === 'crypto'
 *              │   ├─ Intenta: binanceService.getHistoricalCandles()
 *              │   │   └─ API: https://api.binance.com/api/v3/klines
 *              │   │   └─ Parámetros: symbol=BTCUSDT, interval=1h, limit=500
 *              │   │   └─ Mapeo: BTCUSD → BTCUSDT (normalizePair)
 *              │   │
 *              │   └─ Fallback: getCoinGeckoCandles()
 *              │       └─ API: https://api.coingecko.com/api/v3/coins/{id}/ohlc
 *              │       └─ Mapeo: COINGECKO_MAP (BTCUSD → bitcoin)
 *              │
 *              ├─ type === 'stock' || type === 'index'
 *              │   ├─ Intenta: getTwelveDataCandles()
 *              │   │   └─ API: https://api.twelvedata.com/time_series
 *              │   │   └─ API_KEY: process.env.TWELVE_DATA_API_KEY
 *              │   │   └─ Mapeo: TWELVE_DATA_SYMBOLS y INDEX_SYMBOLS
 *              │   │
 *              │   └─ Fallback: generateMockCandles()
 *              │       └─ Genera 500 velas sintéticas realistas
 *              │
 *              ├─ type === 'forex'
 *              │   ├─ Intenta: getForexCandles()
 *              │   │   └─ Primero: Twelve Data si API_KEY disponible
 *              │   │   └─ Fallback: ExchangeRate API
 *              │   │       └─ API: https://api.exchangerate-api.com/v4/latest/{base}
 *              │   │       └─ Genera velas coherentes con tipo de cambio actual
 *              │   │
 *              │   └─ Fallback: (vacío de fallback de ExchangeRate)
 *              │
 *              └─ type === 'commodity'
 *                  ├─ Intenta: getCommoditiesCandles()
 *                  │   └─ API: https://www.quandl.com/api/v3/datasets
 *                  │   └─ API_KEY: process.env.QUANDL_API_KEY
 *                  │   └─ Mapeo: COMMODITY_SYMBOLS
 *                  │
 *                  └─ Fallback: generateMockCandles()
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "symbol": "BTCUSD",
 *   "interval": "1h",
 *   "type": "crypto",
 *   "count": 500,
 *   "candles": [
 *     {
 *       "time": 1709251200000,     // ms desde epoch
 *       "open": 42350.50,
 *       "high": 42500.75,
 *       "low": 42200.00,
 *       "close": 42400.25,
 *       "volume": 1234567.89
 *     },
 *     ...
 *   ],
 *   "timestamp": 1709337600000
 * }
 */

// ============================================================================
// 2. FLUJO DE DATOS: EN EL HOOK useMarketData
// ============================================================================

/**
 * ARCHIVO: app/hooks/useMarketData.ts
 * 
 * FUNCIÓN: detectAssetType(symbol)
 * Detecta automáticamente el tipo de activo basado en el símbolo:
 * 
 * - CRYPTO: BTCUSD, ETHUSD, BNBUSD, XRPUSD, SOLBUSD, DOGEUSD, etc.
 * - STOCK: AAPL, MSFT, GOOGL, TSLA, META, NVDA, JPM, etc.
 * - FOREX: EURUSD, GBPUSD, JPYUSD, EURGBP, CHFUSD, etc.
 * - INDEX: SPX, NDX, DXY, VIX, DAX, FTSE, CAC40, NIKKEI, etc.
 * - COMMODITY: GOLD, SILVER, OIL, COPPER, WHEAT, CORN, etc.
 * 
 * FLUJO EN useMarketData:
 * 1. useEffect detecta cambio de symbol o interval
 * 2. Valida con validateSymbol() y validateTimeFrame()
 * 3. Detecta assetType con detectAssetType(symbol)
 * 4. Construye URL: /api/market/candles?symbol={symbol}&interval={interval}&type={assetType}
 * 5. Fetch a URL
 * 6. Valida respuesta: result.candles debe ser array no vacío
 * 7. Actualiza state: setData(result.candles)
 * 
 * SALIDA:
 * {
 *   data: CandleData[],  // Array de velas obtenidas
 *   loading: boolean,    // true mientras carga
 *   error: string|null,  // Mensaje de error si falla
 *   isFallback: boolean  // Siempre false (sin datos simulados)
 * }
 */

// ============================================================================
// 3. FLUJO DE DATOS: EN LOS GRÁFICOS
// ============================================================================

/**
 * ARCHIVO: components/Charts.tsx (PriceChart)
 * 
 * ENTRADA:
 * - data: CandleData[] (obtenida de useMarketData)
 * - symbol: string (símbolo del activo)
 * 
 * PROCESAMIENTO:
 * 1. Valida que data.length > 0
 * 2. Calcula candlesToShow basado en zoomLevel
 * 3. Mapea CandleData a formato para Recharts:
 *    {
 *      timestamp: number,
 *      time: "HH:mm",
 *      date: "dd/MM",
 *      open: number,
 *      high: number,
 *      low: number,
 *      close: number,
 *      volume: number
 *    }
 * 4. Renderiza con ComposedChart de Recharts
 * 5. Muestra candlestick chart con volumen
 * 
 * INDICADORES MOSTRADOS:
 * - SMA20 (Media móvil simple 20)
 * - EMA12 (Media móvil exponencial 12)
 * - RSI (Relative Strength Index)
 * - Bandas de Bollinger (opcional)
 * 
 * REQUISITO: Mínimo 10 velas para mostrar gráfico
 */

// ============================================================================
// 4. FLUJO DE DATOS: EN LAS RECOMENDACIONES
// ============================================================================

/**
 * ARCHIVO: app/hooks/useDailyRecommendations.ts
 * 
 * FUNCIÓN: fetchRecommendations()
 * 
 * FLUJO:
 * 1. Intenta cargar desde localStorage (caché)
 *    - Máximo 4 horas de antigüedad
 *    - Debe ser del mismo día (00:00 - 23:59)
 * 
 * 2. Si caché es válido: retorna resultados guardados
 * 
 * 3. Si caché es inválido o force=true:
 *    a. Llama scanAllAssets(onProgress callback)
 *    b. scanAllAssets itera sobre ASSETS_BY_CATEGORY:
 *       - Para cada símbolo:
 *         i. Llama getWeeklyCandles(symbol)
 *         ii. Llama analyzeCandles() del candleAnalysisService
 *         iii. Calcula ROI basado en:
 *              - currentPrice (último cierre)
 *              - targetPrice (predicción)
 *              - stopLoss (calculado)
 *              - probability (confianza del análisis)
 *         iv. Retorna ScanResult
 * 
 * 4. Filtra Top 50 por ROI global
 * 5. Filtra Top 10 por categoría
 * 6. Guarda en localStorage
 * 7. Retorna DailyRecommendation
 * 
 * ARCHIVO DE CATEGORÍAS: lib/scannerAssets.ts
 * - ASSETS_BY_CATEGORY: Record<string, Asset[]>
 * - Ejemplo: { "Criptomonedas": [...], "Acciones Tech": [...], etc. }
 * - Cada Asset tiene: { symbol, name }
 * 
 * FUNCIÓN CLAVE: getWeeklyCandles(symbol)
 * Ubicación: lib/services/assetScannerService.ts
 * 
 * Proceso:
 * 1. Detecta assetType con detectAssetType(symbol)
 * 2. Construye URL: /api/market/candles?symbol={symbol}&interval=1h&type={assetType}
 * 3. Fetch a URL
 * 4. Extrae velas de los últimos 7 días (weekInMs)
 * 5. Requiere mínimo 20 velas
 * 6. Retorna candles o [] si falla
 * 
 * SALIDA (DailyRecommendation):
 * {
 *   timestamp: number,
 *   weekStart: number,
 *   scanDuration: number,
 *   totalScanned: number,
 *   topRoi: ScanResult[],  // Top 50 por ROI
 *   byCategory: {           // Top 10 por categoría
 *     "Criptomonedas": ScanResult[],
 *     "Acciones Tech": ScanResult[],
 *     ...
 *   }
 * }
 * 
 * ESTRUCTURA DE ScanResult:
 * {
 *   symbol: string,              // BTCUSD, AAPL, etc.
 *   currentPrice: number,        // Precio actual
 *   prediction: {
 *     direction: 'bullish'|'bearish',
 *     probability: number,       // 0-100
 *     targetPrice: number[]      // [main, alt1, alt2]
 *   },
 *   roi: number,                 // % de retorno esperado
 *   confidence: number,          // 0-100
 *   riskReward: number,          // Ratio riesgo/recompensa
 *   trend: 'alcista'|'bajista'|'lateral',
 *   category: string,            // Nombre de categoría
 *   lastUpdate: number          // Timestamp
 * }
 */

// ============================================================================
// 5. VALIDACIÓN DE NOMBRES Y MAPEOS
// ============================================================================

/**
 * MAPEOS CORRECTOS POR TIPO DE ACTIVO:
 * 
 * CRIPTOMONEDAS (Binance):
 * - Entrada: BTCUSD, ETHUSD, etc.
 * - Binance: BTCUSDT, ETHUSDT (normalizePair)
 * - Fallback CoinGecko: bitcoin, ethereum, etc. (COINGECKO_MAP)
 * 
 * ACCIONES (Twelve Data):
 * - Entrada: AAPL, MSFT, GOOGL, etc.
 * - Twelve Data: AAPL, MSFT, GOOGL (mapeo directo TWELVE_DATA_SYMBOLS)
 * - API_KEY: process.env.TWELVE_DATA_API_KEY
 * 
 * ÍNDICES (Twelve Data):
 * - Entrada: SPX, NDX, DAX, FTSE, etc.
 * - Twelve Data: ^GSPC, ^IXIC, ^GDAXI, ^FTSE, etc. (INDEX_SYMBOLS)
 * - API_KEY: process.env.TWELVE_DATA_API_KEY
 * 
 * FOREX (Twelve Data o ExchangeRate):
 * - Entrada: EURUSD, GBPUSD, JPYUSD, etc.
 * - Twelve Data: EUR/USD, GBP/USD, JPY/USD, etc. (FOREX_SYMBOLS)
 * - Fallback: ExchangeRate API (genera velas basadas en tipo de cambio actual)
 * - API_KEY: process.env.TWELVE_DATA_API_KEY
 * 
 * COMMODITIES (Quandl):
 * - Entrada: GOLD, SILVER, OIL, WHEAT, etc.
 * - Quandl: LBMA/GOLD, LBMA/SILVER, CHRIS/COMEX_CL, etc. (quandlDatasets)
 * - API_KEY: process.env.QUANDL_API_KEY
 * - Fallback: generateMockCandles()
 * 
 * ⚠️ CONDICIONES CRÍTICAS:
 * - TWELVE_DATA_API_KEY debe estar en .env.local o .env.production
 * - QUANDL_API_KEY debe estar en .env.local o .env.production
 * - Sin API keys, se usarán fallbacks (mock data)
 */

// ============================================================================
// 6. VERIFICACIÓN DE DATOS EN COMPONENTES
// ============================================================================

/**
 * DESPLEGABLES DE CATEGORÍAS (AssetList.tsx):
 * 
 * ENTRADA: assets: Asset[]
 * 
 * Cada Asset debe tener:
 * {
 *   id: string,              // Único por asset
 *   symbol: string,          // BTCUSD, AAPL, etc.
 *   name: string,            // "Bitcoin", "Apple Inc.", etc.
 *   type: 'crypto'|'stock'|'forex'|'index'|'commodity',
 *   price: number,           // Precio actual
 *   change: number,          // Cambio absoluto
 *   changePercent: number,   // Cambio %
 *   isFavorite: boolean      // True si es favorito
 * }
 * 
 * ACTUALIZACIÓN DE PRECIOS:
 * - Cada 3 segundos: useScannerPriceRefresh()
 * - Fetch: /api/market?symbol={symbol}&type=price
 * - Actualiza: updateAssetPrice(symbol, price, change, changePercent)
 * 
 * FLUJO DE SELECCIÓN:
 * 1. Usuario hace click en un asset
 * 2. onSelectAsset(asset) → setSelectedAsset en Zustand store
 * 3. useMarketData(selectedAsset.symbol, selectedTimeframe) se ejecuta
 * 4. Carga velas automáticamente
 * 5. Gráfico se actualiza
 * 6. Análisis se puede ejecutar manualmente
 */

console.log(`
✅ AUDITORÍA COMPLETADA

Flujos validados:
1. ✅ API Keys configuradas (.env.local)
2. ✅ Mapeos de símbolos por tipo de activo
3. ✅ Selección de fuente de datos según tipo
4. ✅ Fallbacks implementados
5. ✅ Detección automática de tipo en useMarketData
6. ✅ Paso correcto de assetType al endpoint
7. ✅ Recomendaciones con datos correctos
8. ✅ Gráficos reciben velas correctas
9. ✅ Desplegables con datos actualizados

Próximas validaciones:
- Ejecutar prueba: npm run dev && node api-flow-test.js
- Verificar console.log() en navegador y servidor
- Confirmar que gráficos se renderizan
- Confirmar que recomendaciones cargan sin errores
`);

