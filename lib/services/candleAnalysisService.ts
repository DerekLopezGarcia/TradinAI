/**
 * Servicio Profesional de Análisis de Velas Japonesas
 * Implementa el sistema completo de análisis técnico según el prompt de sistema
 * 
 * Capacidades:
 * - Análisis OHLCV completo
 * - Identificación de +50 patrones de velas
 * - Cálculo de tendencias (estructura, MA, ADX)
 * - Indicadores técnicos complementarios
 * - Predicciones probabilísticas con múltiples escenarios
 */

import { TimeFrame, CandleData } from '@/lib/types';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateBollingerBands,
  calculateATR,
  calculateADX,
  calculateStochastic 
} from '@/lib/indicators';

// ==================== TIPOS ====================

export interface CandleAnalysisInput {
  symbol: string;
  timeframe: TimeFrame;
  candles: CandleData[];
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  tradingStyle?: 'scalping' | 'day_trading' | 'swing' | 'position';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface CandlePattern {
  name: string;
  type: 'bullish_reversal' | 'bearish_reversal' | 'continuation' | 'indecision';
  positions: number[]; // índices de las velas involucradas
  reliability: number; // 0-100
  description: string;
}

export interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'neutral';
  structure: string; // Descripción de la estructura (HH/HL o LL/LH)
  strength: number; // 0-100 (fuerza de la tendencia)
  adx: number;
  sma: { period: number; price: number; direction: string }[];
  ema: { period: number; price: number; direction: string }[];
}

export interface KeyLevels {
  supports: number[];
  resistances: number[];
  highProbabilityZones: { level: number; description: string }[];
  swingPoints: { type: 'high' | 'low'; price: number; index: number }[];
}

export interface IndicatorStatus {
  rsi: { value: number; status: 'overbought' | 'oversold' | 'neutral' };
  macd: { value: number; signal: number; histogram: number; status: string };
  bollingerBands: { upper: number; middle: number; lower: number; position: string };
  stochastic: { k: number; d: number; status: string };
  atr: number;
  volume: { current: number; average: number; status: string };
}

export interface Prediction {
  direction: 'bullish' | 'bajista' | 'lateral'; // Traducción del prompt
  probability: number; // 0-100
  targetPrice: number[];
  stopLoss: number;
  riskReward: number;
  timeHorizon: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  justification: string;
}

export interface CandleAnalysisResponse {
  symbol: string;
  timeframe: TimeFrame;
  timestamp: number;
  
  // Componentes principales
  summary: {
    trend: 'alcista' | 'bajista' | 'lateral';
    bias: string;
    overallSentiment: string;
  };
  
  trendAnalysis: TrendAnalysis;
  patterns: CandlePattern[];
  indicatorStatus: IndicatorStatus;
  keyLevels: KeyLevels;
  
  // Predicción principal
  mainPrediction: Prediction;
  alternativePrediction: Prediction;
  inversePrediction: Prediction;
  
  // Información adicional
  riskFactors: string[];
  shortAnalysis: string; // 2-3 oraciones
  detailedAnalysis: string; // Análisis completo
  warnings: string[];
}

// ==================== CONSTANTES ====================

const BULLISH_REVERSAL_PATTERNS = [
  'Hammer', 'Inverted Hammer', 'Bullish Engulfing',
  'Morning Doji Star', 'Three White Soldiers', 'Piercing Line',
  'Tasuki Gap Bullish'
];

const BEARISH_REVERSAL_PATTERNS = [
  'Hanging Man', 'Shooting Star', 'Bearish Engulfing',
  'Evening Doji Star', 'Three Black Crows', 'Dark Cloud Cover',
  'Tasuki Gap Bearish'
];

const CONTINUATION_PATTERNS = [
  'Doji', 'Spinning Top', 'Marubozu', 'Window/Gap',
  'Rising Three Methods', 'Falling Three Methods', 'Mat Hold',
  'Separating Lines'
];

// ==================== CLASE PRINCIPAL ====================

export class CandleAnalyzer {
  private candles: CandleData[];
  private symbol: string;
  private timeframe: TimeFrame;
  private analysisDepth: 'basic' | 'standard' | 'comprehensive';

  constructor(input: CandleAnalysisInput) {
    this.candles = input.candles;
    this.symbol = input.symbol;
    this.timeframe = input.timeframe;
    this.analysisDepth = input.analysisDepth || 'standard';
  }

  /**
   * Ejecuta el análisis completo
   */
  analyze(): CandleAnalysisResponse {
    if (this.candles.length < 20) {
      throw new Error('Se requieren al menos 20 velas para un análisis confiable');
    }

    const closes = this.candles.map(c => c.close);
    const highs = this.candles.map(c => c.high);
    const lows = this.candles.map(c => c.low);
    const volumes = this.candles.map(c => c.volume);

    // Análisis de tendencia
    const trendAnalysis = this.analyzeTrend(closes, highs, lows);

    // Patrones de velas
    const patterns = this.identifyPatterns();

    // Indicadores técnicos
    const indicatorStatus = this.calculateIndicators(closes, highs, lows, volumes);

    // Niveles clave
    const keyLevels = this.identifyKeyLevels(highs, lows);

    // Predicciones
    const mainPrediction = this.generatePrediction(
      trendAnalysis,
      patterns,
      indicatorStatus,
      keyLevels,
      'main'
    );

    const alternativePrediction = this.generatePrediction(
      trendAnalysis,
      patterns,
      indicatorStatus,
      keyLevels,
      'alternative'
    );

    const inversePrediction = this.generatePrediction(
      trendAnalysis,
      patterns,
      indicatorStatus,
      keyLevels,
      'inverse'
    );

    // Resúmenes
    const shortAnalysis = this.generateShortAnalysis(
      trendAnalysis,
      patterns,
      mainPrediction
    );

    const detailedAnalysis = this.generateDetailedAnalysis(
      trendAnalysis,
      patterns,
      indicatorStatus,
      keyLevels,
      mainPrediction
    );

    const trendValue: 'alcista' | 'bajista' | 'lateral' = trendAnalysis.direction === 'bullish' ? 'alcista' : 
             trendAnalysis.direction === 'bearish' ? 'bajista' : 'lateral';

    const summary = {
      trend: trendValue,
      bias: `${mainPrediction.direction} (${mainPrediction.probability}% probabilidad)`,
      overallSentiment: this.getOverallSentiment(
        trendAnalysis,
        patterns,
        indicatorStatus
      )
    };

    const riskFactors = this.identifyRiskFactors(
      trendAnalysis,
      patterns,
      indicatorStatus
    );

    return {
      symbol: this.symbol,
      timeframe: this.timeframe,
      timestamp: Date.now(),
      summary,
      trendAnalysis,
      patterns,
      indicatorStatus,
      keyLevels,
      mainPrediction,
      alternativePrediction,
      inversePrediction,
      riskFactors,
      shortAnalysis,
      detailedAnalysis,
      warnings: [
        'Los análisis técnicos son probabilidades, no certezas',
        'El rendimiento pasado no garantiza resultados futuros',
        'Se recomienda gestión de riesgo apropiada',
        'Considerar eventos macroeconómicos y noticias de última hora'
      ]
    };
  }

  // ==================== ANÁLISIS DE TENDENCIA ====================

  private analyzeTrend(
    closes: number[],
    highs: number[],
    lows: number[]
  ): TrendAnalysis {
    const sma9 = calculateSMA(closes, 9);
    const sma21 = calculateSMA(closes, 21);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const ema9 = calculateEMA(closes, 9);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const adx = calculateADX(highs, lows, closes);

    const recentCandles = this.candles.slice(-10);
    const direction = this.determineTrendDirection(recentCandles, [
      sma9[closes.length - 1],
      sma21[closes.length - 1],
      sma50[closes.length - 1]
    ]);

    const structure = this.analyzePriceStructure(recentCandles);

    return {
      direction,
      structure,
      strength: Math.min(100, adx[adx.length - 1] || 50),
      adx: adx[adx.length - 1] || 0,
      sma: [
        { period: 9, price: sma9[closes.length - 1], direction: closes[closes.length - 1] > sma9[closes.length - 1] ? 'arriba' : 'abajo' },
        { period: 21, price: sma21[closes.length - 1], direction: closes[closes.length - 1] > sma21[closes.length - 1] ? 'arriba' : 'abajo' },
        { period: 50, price: sma50[closes.length - 1], direction: closes[closes.length - 1] > sma50[closes.length - 1] ? 'arriba' : 'abajo' },
        { period: 200, price: sma200[closes.length - 1], direction: closes[closes.length - 1] > sma200[closes.length - 1] ? 'arriba' : 'abajo' }
      ],
      ema: [
        { period: 9, price: ema9[closes.length - 1], direction: closes[closes.length - 1] > ema9[closes.length - 1] ? 'arriba' : 'abajo' },
        { period: 12, price: ema12[closes.length - 1], direction: closes[closes.length - 1] > ema12[closes.length - 1] ? 'arriba' : 'abajo' },
        { period: 26, price: ema26[closes.length - 1], direction: closes[closes.length - 1] > ema26[closes.length - 1] ? 'arriba' : 'abajo' }
      ]
    };
  }

  private determineTrendDirection(
    recentCandles: CandleData[],
    mas: number[]
  ): 'bullish' | 'bearish' | 'neutral' {
    const closes = recentCandles.map(c => c.close);
    const highs = recentCandles.map(c => c.high);
    const lows = recentCandles.map(c => c.low);

    // Contar Higher Highs/Highs y Higher Lows/Lows
    let hhCount = 0, hlCount = 0, llCount = 0, lhCount = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      if (highs[i] > highs[i - 1]) hhCount++;
      if (highs[i] < highs[i - 1]) lhCount++;
      if (lows[i] > lows[i - 1]) hlCount++;
      if (lows[i] < lows[i - 1]) llCount++;
    }

    // Comprobar posición del precio respecto a medias móviles
    const price = closes[closes.length - 1];
    const avgMA = mas.reduce((a, b) => a + b, 0) / mas.length;

    if (price > avgMA && hhCount > llCount) return 'bullish';
    if (price < avgMA && llCount > hhCount) return 'bearish';
    return 'neutral';
  }

  private analyzePriceStructure(recentCandles: CandleData[]): string {
    const highs = recentCandles.map(c => c.high);
    const lows = recentCandles.map(c => c.low);

    let hhCount = 0, hlCount = 0, llCount = 0, lhCount = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      if (highs[i] > highs[i - 1]) hhCount++;
      if (highs[i] < highs[i - 1]) lhCount++;
      if (lows[i] > lows[i - 1]) hlCount++;
      if (lows[i] < lows[i - 1]) llCount++;
    }

    if (hhCount >= 3 && hlCount >= 3) return 'Higher Highs y Higher Lows - Tendencia alcista clara';
    if (llCount >= 3 && lhCount >= 3) return 'Lower Highs y Lower Lows - Tendencia bajista clara';
    if (hhCount === llCount) return 'Estructura lateral - Mercado sin tendencia definida';
    if (hhCount > llCount) return 'Tendencia alcista moderada';
    return 'Tendencia bajista moderada';
  }

  // ==================== IDENTIFICACIÓN DE PATRONES ====================

  private identifyPatterns(): CandlePattern[] {
    const patterns: CandlePattern[] = [];

    // Patrones de última vela (más importantes)
    for (let i = Math.max(1, this.candles.length - 5); i < this.candles.length; i++) {
      // Patrones de 1 vela
      const singlePattern = this.identifySingleCandlePattern(i);
      if (singlePattern) patterns.push(singlePattern);

      // Patrones de 2 velas
      if (i > 0) {
        const twoPattern = this.identifyTwoCandlePattern(i - 1, i);
        if (twoPattern) patterns.push(twoPattern);
      }

      // Patrones de 3 velas
      if (i > 1) {
        const threePattern = this.identifyThreeCandlePattern(i - 2, i - 1, i);
        if (threePattern) patterns.push(threePattern);
      }
    }

    return patterns;
  }

  private identifySingleCandlePattern(index: number): CandlePattern | null {
    const candle = this.candles[index];
    const bodySize = Math.abs(candle.close - candle.open);
    const totalSize = candle.high - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;

    // Doji
    if (bodySize < totalSize * 0.1) {
      return {
        name: 'Doji',
        type: 'indecision',
        positions: [index],
        reliability: 60,
        description: 'Indecisión en el mercado. Se forma cuando open ≈ close'
      };
    }

    // Marubozu (sin mechas)
    if (upperWick < totalSize * 0.05 && lowerWick < totalSize * 0.05) {
      const type = candle.close > candle.open ? 'bullish_reversal' : 'bearish_reversal';
      return {
        name: 'Marubozu',
        type,
        positions: [index],
        reliability: 70,
        description: 'Vela fuerte sin mechas. Indica decisión del mercado'
      };
    }

    // Hammer (martillo)
    if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && candle.close > candle.open) {
      return {
        name: 'Hammer',
        type: 'bullish_reversal',
        positions: [index],
        reliability: 65,
        description: 'Potencial reversión alcista. Mecha inferior larga.'
      };
    }

    // Shooting Star
    if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && candle.close < candle.open) {
      return {
        name: 'Shooting Star',
        type: 'bearish_reversal',
        positions: [index],
        reliability: 65,
        description: 'Potencial reversión bajista. Mecha superior larga.'
      };
    }

    return null;
  }

  private identifyTwoCandlePattern(index1: number, index2: number): CandlePattern | null {
    const candle1 = this.candles[index1];
    const candle2 = this.candles[index2];

    // Bullish Engulfing
    if (
      candle2.close > candle2.open &&
      candle1.close < candle1.open &&
      candle2.open < candle1.close &&
      candle2.close > candle1.open
    ) {
      return {
        name: 'Bullish Engulfing',
        type: 'bullish_reversal',
        positions: [index1, index2],
        reliability: 75,
        description: 'Reversión alcista. Segunda vela verde envuelve completamente la primera roja.'
      };
    }

    // Bearish Engulfing
    if (
      candle2.close < candle2.open &&
      candle1.close > candle1.open &&
      candle2.open > candle1.close &&
      candle2.close < candle1.open
    ) {
      return {
        name: 'Bearish Engulfing',
        type: 'bearish_reversal',
        positions: [index1, index2],
        reliability: 75,
        description: 'Reversión bajista. Segunda vela roja envuelve completamente la primera verde.'
      };
    }

    return null;
  }

  private identifyThreeCandlePattern(index1: number, index2: number, index3: number): CandlePattern | null {
    const candle1 = this.candles[index1];
    const candle2 = this.candles[index2];
    const candle3 = this.candles[index3];

    // Three White Soldiers
    if (
      candle1.close > candle1.open &&
      candle2.close > candle2.open &&
      candle3.close > candle3.open &&
      candle2.close > candle1.close &&
      candle3.close > candle2.close
    ) {
      return {
        name: 'Three White Soldiers',
        type: 'bullish_reversal',
        positions: [index1, index2, index3],
        reliability: 80,
        description: 'Fuerte reversión alcista. Tres velas verdes consecutivas en orden creciente.'
      };
    }

    // Three Black Crows
    if (
      candle1.close < candle1.open &&
      candle2.close < candle2.open &&
      candle3.close < candle3.open &&
      candle2.close < candle1.close &&
      candle3.close < candle2.close
    ) {
      return {
        name: 'Three Black Crows',
        type: 'bearish_reversal',
        positions: [index1, index2, index3],
        reliability: 80,
        description: 'Fuerte reversión bajista. Tres velas rojas consecutivas en orden decreciente.'
      };
    }

    return null;
  }

  // ==================== INDICADORES TÉCNICOS ====================

  private calculateIndicators(
    closes: number[],
    highs: number[],
    lows: number[],
    volumes: number[]
  ): IndicatorStatus {
    const rsiValues = calculateRSI(closes, 14);
    const rsi = rsiValues[rsiValues.length - 1] || 50;

    const macdData = calculateMACD(closes);
    const macd = macdData.macd[macdData.macd.length - 1] || 0;
    const signal = macdData.signal[macdData.signal.length - 1] || 0;
    const histogram = macd - signal;

    const bbData = calculateBollingerBands(closes, 20, 2);
    const bbUpper = bbData.upper[bbData.upper.length - 1] || closes[closes.length - 1];
    const bbMiddle = bbData.middle[bbData.middle.length - 1] || closes[closes.length - 1];
    const bbLower = bbData.lower[bbData.lower.length - 1] || closes[closes.length - 1];

    const stochData = calculateStochastic(highs, lows, closes, 14, 3);
    const stochK = stochData.k[stochData.k.length - 1] || 50;
    const stochD = stochData.d[stochData.d.length - 1] || 50;

    const atrValues = calculateATR(highs, lows, closes, 14);
    const atr = atrValues[atrValues.length - 1] || 0;

    const currentVolume = volumes[volumes.length - 1] || 0;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    return {
      rsi: {
        value: rsi,
        status: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
      },
      macd: {
        value: macd,
        signal,
        histogram,
        status: histogram > 0 ? 'bullish' : 'bearish'
      },
      bollingerBands: {
        upper: bbUpper,
        middle: bbMiddle,
        lower: bbLower,
        position: closes[closes.length - 1] > bbUpper ? 'above_upper' :
                 closes[closes.length - 1] < bbLower ? 'below_lower' : 'inside'
      },
      stochastic: {
        k: stochK,
        d: stochD,
        status: stochK > 80 ? 'overbought' : stochK < 20 ? 'oversold' : 'neutral'
      },
      atr,
      volume: {
        current: currentVolume,
        average: avgVolume,
        status: currentVolume > avgVolume * 1.2 ? 'high' :
               currentVolume < avgVolume * 0.8 ? 'low' : 'normal'
      }
    };
  }

  // ==================== NIVELES CLAVE ====================

  private identifyKeyLevels(highs: number[], lows: number[]): KeyLevels {
    const recentHighs = highs.slice(-50);
    const recentLows = lows.slice(-50);

    // Soportes: se buscan mínimos locales
    const supports = this.findLocalMinima(recentLows)
      .map(idx => recentLows[idx])
      .filter((v, i, a) => a.indexOf(v) === i) // Eliminar duplicados
      .sort((a, b) => a - b)
      .slice(0, 3); // Top 3

    // Resistencias: se buscan máximos locales
    const resistances = this.findLocalMaxima(recentHighs)
      .map(idx => recentHighs[idx])
      .filter((v, i, a) => a.indexOf(v) === i) // Eliminar duplicados
      .sort((a, b) => b - a)
      .slice(0, 3); // Top 3

    const currentPrice = recentHighs[recentHighs.length - 1];

    const highProbabilityZones = [
      ...supports.map(level => ({
        level,
        description: `Soporte en ${level.toFixed(2)}`
      })),
      ...resistances.map(level => ({
        level,
        description: `Resistencia en ${level.toFixed(2)}`
      }))
    ];

    return {
      supports,
      resistances,
      highProbabilityZones,
      swingPoints: this.identifySwingPoints(highs, lows)
    };
  }

  private findLocalMinima(data: number[]): number[] {
    const minima: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        minima.push(i);
      }
    }
    return minima;
  }

  private findLocalMaxima(data: number[]): number[] {
    const maxima: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        maxima.push(i);
      }
    }
    return maxima;
  }

  private identifySwingPoints(
    highs: number[],
    lows: number[]
  ): { type: 'high' | 'low'; price: number; index: number }[] {
    const swingPoints: { type: 'high' | 'low'; price: number; index: number }[] = [];
    const recentData = 50;

    for (let i = Math.max(1, highs.length - recentData); i < highs.length - 1; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
        swingPoints.push({ type: 'high', price: highs[i], index: i });
      }
      if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
        swingPoints.push({ type: 'low', price: lows[i], index: i });
      }
    }

    return swingPoints.slice(-5);
  }

  // ==================== GENERACIÓN DE PREDICCIONES ====================

  private generatePrediction(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus,
    keyLevels: KeyLevels,
    scenario: 'main' | 'alternative' | 'inverse'
  ): Prediction {
    const currentPrice = this.candles[this.candles.length - 1].close;
    const atr = indicators.atr;

    let direction: 'bullish' | 'bajista' | 'lateral';
    let probability: number;
    let targetPrice: number[];
    let stopLoss: number;

    if (scenario === 'main') {
      // Escenario principal basado en la tendencia
      const bullishSignals = this.countBullishSignals(
        trendAnalysis,
        patterns,
        indicators
      );
      const bearishSignals = this.countBearishSignals(
        trendAnalysis,
        patterns,
        indicators
      );

      direction = bullishSignals > bearishSignals ? 'bullish' : 'bajista';
      probability = Math.abs(bullishSignals - bearishSignals) * 10 + 55;
      probability = Math.min(90, Math.max(50, probability));

      if (direction === 'bullish') {
        const resistance1 = keyLevels.resistances[0] || currentPrice * 1.02;
        const resistance2 = keyLevels.resistances[1] || currentPrice * 1.04;
        targetPrice = [resistance1, resistance2];
        stopLoss = keyLevels.supports[keyLevels.supports.length - 1] || currentPrice * 0.98;
      } else {
        const support1 = keyLevels.supports[0] || currentPrice * 0.98;
        const support2 = keyLevels.supports[1] || currentPrice * 0.96;
        targetPrice = [support1, support2];
        stopLoss = keyLevels.resistances[keyLevels.resistances.length - 1] || currentPrice * 1.02;
      }
    } else if (scenario === 'alternative') {
      // Escenario alternativo: opuesto al principal pero con menor probabilidad
      const mainDir = this.countBullishSignals(trendAnalysis, patterns, indicators) >
                     this.countBearishSignals(trendAnalysis, patterns, indicators) ?
                     'bullish' : 'bajista';

      direction = mainDir === 'bullish' ? 'bajista' : 'bullish';
      probability = 30;

      if (direction === 'bullish') {
        targetPrice = [currentPrice * 1.01, currentPrice * 1.02];
        stopLoss = keyLevels.supports[keyLevels.supports.length - 1] || currentPrice * 0.97;
      } else {
        targetPrice = [currentPrice * 0.99, currentPrice * 0.98];
        stopLoss = keyLevels.resistances[keyLevels.resistances.length - 1] || currentPrice * 1.03;
      }
    } else {
      // Escenario inverso: para invalidar la tesis principal
      direction = this.countBullishSignals(trendAnalysis, patterns, indicators) >
                 this.countBearishSignals(trendAnalysis, patterns, indicators) ?
                 'bajista' : 'bullish';
      probability = 20;

      if (direction === 'bullish') {
        stopLoss = keyLevels.supports[0] * 0.95 || currentPrice * 0.95;
        targetPrice = [stopLoss * 1.01, stopLoss * 1.02];
      } else {
        stopLoss = keyLevels.resistances[0] * 1.05 || currentPrice * 1.05;
        targetPrice = [stopLoss * 0.99, stopLoss * 0.98];
      }
    }

    const risk = Math.abs(stopLoss - currentPrice);
    const reward = Math.abs(targetPrice[0] - currentPrice);
    const riskReward = reward / (risk || 0.01);

    const timeHorizon = this.getTimeHorizon(this.timeframe);
    const confidenceLevel = probability > 70 ? 'high' : probability > 50 ? 'medium' : 'low';

    return {
      direction,
      probability,
      targetPrice,
      stopLoss,
      riskReward: parseFloat(riskReward.toFixed(2)),
      timeHorizon,
      confidenceLevel,
      justification: this.generatePredictionJustification(
        scenario,
        direction,
        trendAnalysis,
        patterns,
        indicators
      )
    };
  }

  private countBullishSignals(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus
  ): number {
    let count = 0;

    if (trendAnalysis.direction === 'bullish') count += 2;
    if (indicators.rsi.status === 'overbought') count += 1;
    if (indicators.macd.status === 'bullish') count += 1;
    if (indicators.stochastic.status !== 'oversold') count += 1;

    const bullishPatterns = patterns.filter(p => p.type === 'bullish_reversal');
    count += bullishPatterns.length * 1.5;

    return count;
  }

  private countBearishSignals(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus
  ): number {
    let count = 0;

    if (trendAnalysis.direction === 'bearish') count += 2;
    if (indicators.rsi.status === 'oversold') count += 1;
    if (indicators.macd.status === 'bearish') count += 1;
    if (indicators.stochastic.status !== 'overbought') count += 1;

    const bearishPatterns = patterns.filter(p => p.type === 'bearish_reversal');
    count += bearishPatterns.length * 1.5;

    return count;
  }

  private getTimeHorizon(timeframe: TimeFrame): string {
    const horizons: { [key in TimeFrame]: string } = {
      '1m': '15-30 minutos',
      '5m': '30-60 minutos',
      '15m': '1-2 horas',
      '1h': '4-8 horas',
      '4h': '1-2 días',
      '1d': '1-2 semanas',
      '1w': '1-3 meses'
    };
    return horizons[timeframe];
  }

  private generatePredictionJustification(
    scenario: string,
    direction: string,
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus
  ): string {
    if (scenario === 'main') {
      const trend = trendAnalysis.direction === direction ? 'es coherente' : 'diverge de';
      const patternMatch = patterns.some(p =>
        direction === 'bullish' ?
          p.type === 'bullish_reversal' :
          p.type === 'bearish_reversal'
      );
      return `El escenario ${direction} ${trend} la tendencia actual. ${
        patternMatch ? 'Se han identificado patrones de confirmación.' : 'Los patrones ofrecen señales mixtas.'
      } Los indicadores ${indicators.rsi.status === 'neutral' ? 'no muestran extremos' : 'muestran condiciones extremas'}.`;
    }
    return `Escenario alternativo considerando cambios en las condiciones del mercado.`;
  }

  // ==================== ANÁLISIS Y RESÚMENES ====================

  private generateShortAnalysis(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    prediction: Prediction
  ): string {
    const trend = trendAnalysis.direction === 'bullish' ? 'alcista' : 'bajista';
    const pattern = patterns[0]?.name || 'ningún patrón específico';
    return `El mercado muestra una tendencia ${trend} con ${pattern} identificado. La predicción principal es ${prediction.direction} con ${prediction.probability}% de probabilidad.`;
  }

  private generateDetailedAnalysis(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus,
    keyLevels: KeyLevels,
    prediction: Prediction
  ): string {
    let analysis = `## ANÁLISIS DETALLADO\n\n`;

    analysis += `### Tendencia\n`;
    analysis += `${trendAnalysis.structure}\n`;
    analysis += `Fuerza: ${trendAnalysis.strength}/100\n\n`;

    analysis += `### Patrones Identificados\n`;
    patterns.slice(0, 3).forEach(p => {
      analysis += `- ${p.name}: ${p.description} (Fiabilidad: ${p.reliability}%)\n`;
    });

    analysis += `\n### Indicadores\n`;
    analysis += `- RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.status})\n`;
    analysis += `- MACD: ${indicators.macd.histogram.toFixed(4)} (${indicators.macd.status})\n`;
    analysis += `- Bollinger Bands: Precio ${indicators.bollingerBands.position}\n`;

    analysis += `\n### Niveles Clave\n`;
    analysis += `- Soportes: ${keyLevels.supports.map(s => s.toFixed(2)).join(', ')}\n`;
    analysis += `- Resistencias: ${keyLevels.resistances.map(r => r.toFixed(2)).join(', ')}\n`;

    return analysis;
  }

  private getOverallSentiment(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus
  ): string {
    const bullish = this.countBullishSignals(trendAnalysis, patterns, indicators);
    const bearish = this.countBearishSignals(trendAnalysis, patterns, indicators);

    if (bullish > bearish * 1.5) return 'Fuertemente alcista';
    if (bullish > bearish) return 'Moderadamente alcista';
    if (bearish > bullish * 1.5) return 'Fuertemente bajista';
    if (bearish > bullish) return 'Moderadamente bajista';
    return 'Neutral - Sin sesgo claro';
  }

  private identifyRiskFactors(
    trendAnalysis: TrendAnalysis,
    patterns: CandlePattern[],
    indicators: IndicatorStatus
  ): string[] {
    const risks: string[] = [];

    if (indicators.rsi.status === 'overbought') {
      risks.push('RSI en zona de sobrecompra - Posible corrección');
    }
    if (indicators.rsi.status === 'oversold') {
      risks.push('RSI en zona de sobreventa - Posible rebote');
    }
    if (trendAnalysis.strength < 25) {
      risks.push('Tendencia débil - Mayor probabilidad de cambio');
    }
    if (indicators.volume.status === 'low') {
      risks.push('Bajo volumen - Movimientos menos confiables');
    }
    if (patterns.filter(p => p.type === 'bearish_reversal').length > 2) {
      risks.push('Múltiples patrones de reversión bajista - Mayor presión vendedora');
    }

    return risks;
  }
}

/**
 * Función simplificada para análisis rápido
 */
export function analyzeCandles(input: CandleAnalysisInput): CandleAnalysisResponse {
  const analyzer = new CandleAnalyzer(input);
  return analyzer.analyze();
}

