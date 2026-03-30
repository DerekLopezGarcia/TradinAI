/**
 * Servicio de escaneo de activos
 * Analiza múltiples activos y encuentra los mejores con RI >= 10%
 */

import { analyzeCandles, CandleAnalysisInput } from './candleAnalysisService';
import { CandleData, TimeFrame } from '@/lib/types';
import { binanceService } from './binanceService';

export interface AssetCategory {
  name: string;
  description: string;
}

export interface ScanResult {
  symbol: string;
  currentPrice: number;
  prediction: {
    direction: 'bullish' | 'bearish';
    probability: number;
    targetPrice: number[];
  };
  roi: number; // Retorno de Inversión esperado en %
  confidence: number; // 0-100
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

// Activos disponibles por categoría
const ASSETS_BY_CATEGORY = {
  'Criptomonedas': [
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'DOGEUSD',
    'ADAUSD', 'SOLUSD', 'POLYUSD', 'AVAXUSD', 'LINKUSD'
  ],
  'Forex Mayor': [
    'EURUSD', 'GBPUSD', 'JPYUSD', 'CHFUSD', 'CADUSD',
    'AUDUSD', 'NZDUSD', 'SGDUSD', 'HKDUSD', 'NOKUSD'
  ],
  'Indices': [
    'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE'
  ],
  'Commodities': [
    'GOLD', 'SILVER', 'COPPER', 'OIL', 'NATGAS',
    'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE'
  ],
  'Tecnología': [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    'TSLA', 'META', 'NFLX', 'ADBE', 'INTC'
  ]
};

/**
 * Obtiene datos de velas de la semana para un activo
 */
async function getWeeklyCandles(symbol: string): Promise<CandleData[]> {
  try {
    // Obtener datos históricos de 1 semana con intervalo de 1 hora
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const endTime = Date.now();
    const startTime = endTime - weekInMs;

    // Aquí iría la llamada real a Binance o tu API
    // Por ahora retornamos datos simulados
    const candles: CandleData[] = [];
    let currentTime = startTime;
    const hourInMs = 60 * 60 * 1000;

    // Simular velas de la semana (aproximadamente 168 velas)
    while (currentTime < endTime) {
      const basePrice = 40000 + Math.random() * 5000;
      candles.push({
        time: currentTime,
        open: basePrice,
        high: basePrice + Math.random() * 500,
        low: basePrice - Math.random() * 500,
        close: basePrice + (Math.random() - 0.5) * 1000,
        volume: 1000 + Math.random() * 5000,
      });
      currentTime += hourInMs;
    }

    return candles;
  } catch (error) {
    console.error(`Error obteniendo velas para ${symbol}:`, error);
    return [];
  }
}

/**
 * Calcula el ROI esperado basado en el análisis
 */
function calculateROI(
  currentPrice: number,
  targetPrices: number[],
  stopLoss: number,
  probability: number
): number {
  if (targetPrices.length === 0) return 0;

  // Usar el primer target como objetivo principal
  const mainTarget = targetPrices[0];
  const potentialGain = ((mainTarget - currentPrice) / currentPrice) * 100;
  const potentialLoss = ((currentPrice - stopLoss) / currentPrice) * 100;

  // Ajustar por probabilidad
  const expectedReturn = (potentialGain * (probability / 100)) - (potentialLoss * ((100 - probability) / 100));

  return Math.max(expectedReturn, 0);
}

/**
 * Escanea un activo individual
 */
async function scanAsset(
  symbol: string,
  category: string
): Promise<ScanResult | null> {
  try {
    // Obtener velas de la semana
    const candles = await getWeeklyCandles(symbol);

    if (candles.length < 20) {
      console.warn(`Insuficientes datos para ${symbol}`);
      return null;
    }

    // Realizar análisis
    const analysis = analyzeCandles({
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

    // Calcular ROI
    const roi = calculateROI(
      currentPrice,
      prediction.targetPrice,
      prediction.stopLoss,
      prediction.probability
    );

    // Solo retornar si ROI >= 10%
    if (roi < 10) {
      return null;
    }

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

/**
 * Escanea todos los activos y retorna recomendaciones
 */
export async function scanAllAssets(): Promise<DailyRecommendation> {
  const startTime = Date.now();
  const scanStartDate = new Date(startTime);
  scanStartDate.setDate(scanStartDate.getDate() - scanStartDate.getDay()); // Lunes
  const weekStart = scanStartDate.getTime();

  const topRoi: ScanResult[] = [];
  const byCategory: { [key: string]: ScanResult[] } = {};

  let totalScanned = 0;

  // Escanear cada categoría
  for (const [category, symbols] of Object.entries(ASSETS_BY_CATEGORY)) {
    byCategory[category] = [];

    for (const symbol of symbols) {
      totalScanned++;

      try {
        const result = await scanAsset(symbol, category);

        if (result) {
          byCategory[category].push(result);
          topRoi.push(result);
        }
      } catch (error) {
        console.error(`Error procesando ${symbol}:`, error);
      }

      // Pequeño delay para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Ordenar por ROI dentro de cada categoría
  for (const category in byCategory) {
    byCategory[category].sort((a, b) => b.roi - a.roi);
    // Mantener solo los top 3 por categoría
    byCategory[category] = byCategory[category].slice(0, 3);
  }

  // Ordenar globalmente por ROI
  topRoi.sort((a, b) => b.roi - a.roi);

  const scanDuration = Date.now() - startTime;

  return {
    timestamp: Date.now(),
    weekStart,
    scanDuration,
    totalScanned,
    topRoi: topRoi.slice(0, 10), // Top 10 globales
    byCategory,
  };
}

/**
 * Obtiene recomendaciones guardadas del día
 */
export function getSavedRecommendations(): DailyRecommendation | null {
  if (typeof window === 'undefined') return null;

  const saved = localStorage.getItem('dailyRecommendations');
  if (!saved) return null;

  const recommendation = JSON.parse(saved) as DailyRecommendation;

  // Verificar si es del día de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const savedDate = new Date(recommendation.timestamp);
  savedDate.setHours(0, 0, 0, 0);

  if (today.getTime() === savedDate.getTime()) {
    return recommendation;
  }

  return null;
}

/**
 * Guarda recomendaciones en localStorage
 */
export function saveRecommendations(recommendation: DailyRecommendation): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dailyRecommendations', JSON.stringify(recommendation));
}

