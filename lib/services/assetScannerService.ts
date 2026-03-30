/**
 * Servicio de escaneo de activos
 */

import { analyzeCandles } from './candleAnalysisService';
import { CandleData } from '@/lib/types';
import { ASSETS_BY_CATEGORY } from '@/lib/scannerAssets';

type AssetType = 'crypto' | 'stock' | 'forex' | 'index' | 'commodity';

function detectAssetType(symbol: string): AssetType {
  // Criptomonedas - completo
  const cryptoSymbols = new Set([
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLBUSD', 'DOGEUSD', 'ADAUSD', 'POLYUSD',
    'AVAXUSD', 'LINKUSD', 'MATICUSD', 'LTCUSD', 'DOTUSD', 'ETCUSD', 'XMRUSD', 'DASHUSD',
    'ZECUSD', 'XLMUSD', 'XTZUSD', 'COSMUSD', 'FILUSD', 'WAVESUSD', 'NEARUSD', 'ATOMUSD',
    'ALGOUSD', 'VETUSD', 'IOTAUSD', 'HBARUSD', 'CHZUSD', 'SANDUSD', 'SUIUSD', 'ARBUSD'
  ]);

  // Commodities - completo
  const commodities = [
    'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'OIL', 'GASOIL', 'NATGAS',
    'BRENT', 'WTI', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COCOA', 'COTTON',
    'LUMBER', 'NICKEL', 'ALUMINUM', 'ZINC', 'TIN', 'RICE'
  ];

  // Índices - completo
  const indices = [
    'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX',
    'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 'RUSINDEX',
    'MEXBOL', 'BOVESPA', 'KLCI', 'SET'
  ];

  // Forex - completo
  const forexPairs = [
    'EURUSD', 'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
    'GBPUSD', 'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
    'JPYUSD', 'CHFJPY', 'CADJPY', 'AUDJPY', 'NZDJPY',
    'CHFUSD', 'CADUSD', 'AUDUSD', 'NZDUSD', 'SGDUSD', 'HKDUSD', 'NOKUSD',
    'BRLRSD', 'INRUSD', 'ZARUSD', 'MXNUSD', 'SEKUSD', 'DKKUSD'
  ];

  // Acciones (stocks) - completo
  const stocks = [
    // Tecnología
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'TSLA', 'META',
    'NFLX', 'ADBE', 'INTC', 'AMD', 'QCOM', 'CSCO', 'ORCL', 'IBM',
    'CRM', 'SHOP', 'SQ', 'PYPL', 'TWLO', 'OKTA', 'DDOG',
    'BROADCOM', 'MRVL', 'SNAP', 'PINS', 'TWTR', 'DISC', 'RBLX', 'ZM', 'DOCU',
    'CRSR', 'LOGI',
    // Bancos
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SPG', 'PNC', 'USB', 'KEY',
    'HSBC', 'BARCLAYS', 'DBKR', 'BBVA', 'SAB',
    // Consumo
    'MCD', 'SBUX', 'WMT', 'TGT', 'KR', 'CVS', 'HD', 'LOW',
    'PG', 'KO', 'PEP', 'MDLZ', 'GIS', 'COST', 'CLX',
    'NKE', 'LULU', 'DECK', 'GXO',
    // Salud
    'JNJ', 'PFE', 'MRNA', 'BNTX', 'RHHBY', 'NVAX', 'REGN', 'BIIB',
    'AMGN', 'GILD', 'VRTX', 'BMRN', 'EXEL', 'ABT', 'MDT', 'ISRG',
    // Energía
    'XOM', 'CVX', 'OKE', 'KMI', 'ENB', 'TC', 'MPC',
    'PLUG', 'ICLN',
    // Inmobiliario
    'AMT', 'PLD', 'DLR', 'EQIX', 'ARE', 'WELL',
    'PHM', 'LEN', 'TOL', 'NVR', 'KBH',
    // Utilities
    'NEE', 'DUK', 'SO', 'AEP', 'EXC', 'PCG', 'XEL',
    // Telecomunicaciones
    'VZ', 'T', 'TMUS', 'CMCSA', 'CHTR', 'NTT', 'AKAM', 'NETSCOUT',
    // Industriales
    'BA', 'RTX', 'LMT', 'GE', 'HON', 'ITW', 'CARR', 'CAT', 'PCAR', 'DE',
    // Materiales
    'FCX', 'NEM', 'SCCO', 'ALB', 'ARCATHON', 'WRK', 'IP', 'PKG'
  ];

  if (cryptoSymbols.has(symbol)) return 'crypto';
  if (commodities.includes(symbol)) return 'commodity';
  if (indices.includes(symbol)) return 'index';
  if (forexPairs.includes(symbol)) return 'forex';
  if (stocks.includes(symbol)) return 'stock';

  return 'stock'; // default para símbolos desconocidos
}

export interface ScanResult {
  symbol: string;
  currentPrice: number;
  prediction: {
    direction: 'bullish' | 'bearish';
    probability: number;
    targetPrice: number[];
  };
  roi: number;
  confidence: number;
  riskReward: number;
  trend: 'alcista' | 'bajista' | 'lateral';
  category: string;
  lastUpdate: number;
}

export interface DailyRecommendation {
  timestamp: number;
  weekStart: number;
  scanDuration: number;
  totalScanned: number;
  topRoi: ScanResult[];
  byCategory: {
    [category: string]: ScanResult[];
  };
}

async function getWeeklyCandles(symbol: string): Promise<CandleData[]> {
  try {
    const assetType = detectAssetType(symbol);
    const url = `/api/market/candles?symbol=${symbol}&interval=1h&type=${assetType}`;
    
    console.log(`  🔄 ${symbol} (${assetType})...`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`  ❌ ${symbol} (${assetType}): HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.candles || data.candles.length === 0) {
      console.warn(`  ❌ ${symbol}: sin datos en respuesta`);
      return [];
    }

    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - weekInMs;
    const weeklyCandles = data.candles.filter((c: CandleData) => c.time >= cutoffTime);

    if (weeklyCandles.length < 20) {
      console.warn(`  ⚠️ ${symbol}: solo ${weeklyCandles.length} velas en la semana`);
      return [];
    }

    console.log(`  ✅ ${symbol}: ${weeklyCandles.length} velas`);
    return weeklyCandles;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error';
    console.error(`  ❌ ${symbol}: ${msg}`);
    return [];
  }
}

function calculateROI(
  currentPrice: number,
  targetPrices: number[],
  stopLoss: number,
  probability: number
): number {
  if (targetPrices.length === 0) return 0;

  const mainTarget = targetPrices[0];
  const potentialGain = ((mainTarget - currentPrice) / currentPrice) * 100;
  const potentialLoss = ((currentPrice - stopLoss) / currentPrice) * 100;

  const expectedReturn = (potentialGain * (probability / 100)) - (potentialLoss * ((100 - probability) / 100));

  return Math.max(expectedReturn, 0);
}

async function scanAsset(
  symbol: string,
  category: string
): Promise<ScanResult | null> {
  try {
    const candles = await getWeeklyCandles(symbol);

    if (candles.length < 20) {
      return null;
    }

    const analysis = await analyzeCandles({
      symbol,
      timeframe: '1h',
      candles,
      analysisDepth: 'comprehensive',
    });

    if (!analysis) {
      return null;
    }

    const currentPrice = candles[candles.length - 1].close;
    const prediction = analysis.mainPrediction;
    const trend = analysis.summary.trend;
    const riskReward = prediction.riskReward || 1;

    const roi = calculateROI(
      currentPrice,
      prediction.targetPrice,
      prediction.stopLoss,
      prediction.probability
    );

    return {
      symbol,
      currentPrice,
      prediction: {
        direction: prediction.direction as 'bullish' | 'bearish',
        probability: prediction.probability,
        targetPrice: prediction.targetPrice,
      },
      roi: Math.round(roi * 100) / 100,
      confidence: prediction.probability,
      riskReward,
      trend: trend as 'alcista' | 'bajista' | 'lateral',
      category,
      lastUpdate: Date.now(),
    };
  } catch (error) {
    console.error(`Error escaneando ${symbol}:`, error);
    return null;
  }
}

export type ProgressCallback = (progress: {
  current: number;
  total: number;
  currentSymbol: string;
  percentage: number;
}) => void;

export async function scanAllAssets(onProgress?: ProgressCallback): Promise<DailyRecommendation> {
  const startTime = Date.now();
  const scanStartDate = new Date(startTime);
  scanStartDate.setDate(scanStartDate.getDate() - scanStartDate.getDay());
  const weekStart = scanStartDate.getTime();

  const topRoi: ScanResult[] = [];
  const byCategory: { [key: string]: ScanResult[] } = {};

  let totalScanned = 0;
  let successfulScans = 0;
  let failedScans = 0;

  let totalAssets = 0;
  for (const symbols of Object.values(ASSETS_BY_CATEGORY)) {
    totalAssets += symbols.length;
  }

  let currentIndex = 0;

  for (const [category, assets] of Object.entries(ASSETS_BY_CATEGORY)) {
    const symbols = assets.map((a: any) => a.symbol); // Extraer símbolos del formato objeto
    byCategory[category] = [];

    for (const symbol of symbols) {
      currentIndex++;
      totalScanned++;
      const percentage = Math.round((currentIndex / totalAssets) * 100);

      if (onProgress) {
        onProgress({
          current: currentIndex,
          total: totalAssets,
          currentSymbol: symbol,
          percentage,
        });
      }

      try {
        const result = await scanAsset(symbol, category);

        if (result) {
          byCategory[category].push(result);
          topRoi.push(result);
          successfulScans++;
        } else {
          failedScans++;
        }
      } catch (error) {
        console.error(`❌ ${symbol}:`, error);
        failedScans++;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  for (const category in byCategory) {
    byCategory[category].sort((a, b) => b.roi - a.roi);
    byCategory[category] = byCategory[category].slice(0, 10);
  }

  topRoi.sort((a, b) => b.roi - a.roi);

  const scanDuration = Date.now() - startTime;

  console.log(`✅ Escaneo: ${successfulScans} analizados, ${failedScans} sin datos`);

  return {
    timestamp: Date.now(),
    weekStart,
    scanDuration,
    totalScanned,
    topRoi: topRoi.slice(0, 50),
    byCategory,
  };
}

export function getSavedRecommendations(): DailyRecommendation | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('dailyRecommendations');
  if (!saved) return null;

  try {
    const recommendation = JSON.parse(saved) as DailyRecommendation;

    const now = Date.now();
    const age = now - recommendation.timestamp;
    const maxAge = 4 * 60 * 60 * 1000;

    if (age > maxAge) {
      clearRecommendationsCache();
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const savedDate = new Date(recommendation.timestamp);
    savedDate.setHours(0, 0, 0, 0);

    if (today.getTime() === savedDate.getTime()) {
      return recommendation;
    }

    clearRecommendationsCache();
    return null;
  } catch (error) {
    console.error('Error parsing saved recommendations:', error);
    clearRecommendationsCache();
    return null;
  }
}

export function saveRecommendations(recommendation: DailyRecommendation): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dailyRecommendations', JSON.stringify(recommendation));
}

export function clearRecommendationsCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dailyRecommendations');
}

