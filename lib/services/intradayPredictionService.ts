/**
 * Servicio de Predicción de Movimientos Intraday - T2.3
 * 
 * Predice movimientos de precio para las próximas 4-24 horas
 * basado en:
 * - Patrones históricos vs patrón actual
 * - Momentum y volatilidad
 * - Horarios de mercado
 * - Contexto técnico
 */

import { CandleData, TimeFrame } from '@/lib/types';

export interface IntradayPrediction {
  timeframe: '4h' | '8h' | '24h';
  expectedDirection: 'up' | 'down' | 'neutral';
  probability: number;                    // 0-100, prediction confidence (scaled from internal 20-80 range)
  priceTarget: number | null;             // Precio objetivo estimado
  priceTargetPercent: number;             // % de cambio esperado
  
  // Análisis que respalda la predicción
  factors: {
    momentum: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
    volatility: 'very_low' | 'low' | 'normal' | 'high' | 'very_high';
    trend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
    patternMatch: number;                 // % de similitud con patrones históricos
    timeOfDay: string;                    // Contexto de horario de mercado
  };
  
  // Niveles técnicos esperados
  expectedLevels: {
    support: number;
    resistance: number;
  };
  
  reasoning: string;
  timestamp: number;
}

export interface PredictionMetrics {
  accuracy: number;           // % de predicciones correctas históricamente
  precisionUp: number;        // Precisión en predicciones "up"
  precisionDown: number;      // Precisión en predicciones "down"
  averagePnl: number;        // PnL promedio de las predicciones
}

export class IntradayPredictionService {
  /**
   * Predecir movimiento intraday para un símbolo
   */
  public predictMovement(
    symbol: string,
    currentCandles: CandleData[],
    allHistoricalCandles: CandleData[],
    currentPrice: number,
    timeframe: TimeFrame = '1h'
  ): IntradayPrediction {
    // Map input timeframe to prediction output timeframe
    // Short timeframes (1m-1h) → 4h prediction
    // Medium timeframes (4h) → 8h prediction
    // Long timeframes (1d+) → 24h prediction
    let predictionTimeframe: '4h' | '8h' | '24h' = '4h';
    if (timeframe === '4h') {
      predictionTimeframe = '8h';
    } else if (timeframe === '1d' || timeframe === '1w') {
      predictionTimeframe = '24h';
    }

    // Calcular métricas actuales
    const currentMomentum = this.calculateMomentum(currentCandles);
    const currentVolatility = this.calculateVolatility(currentCandles);
    const currentTrend = this.determineTrend(currentCandles);

    // Analizar patrones históricos similares
    const historicalPattern = this.findSimilarHistoricalPatterns(
      currentCandles,
      allHistoricalCandles
    );

    // Calcular soporte y resistencia
    const { support, resistance } = this.calculateSupportResistance(
      currentCandles,
      allHistoricalCandles
    );

    // Combinar factores para predicción con el timeframe especificado
    const prediction = this.generatePrediction(
      predictionTimeframe,
      currentMomentum,
      currentVolatility,
      currentTrend,
      historicalPattern,
      support,
      resistance,
      currentPrice
    );

    return prediction;
  }

  /**
   * Calcular momentum (RSI simplificado)
   */
  private calculateMomentum(candles: CandleData[]): 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative' {
    if (candles.length < 14) return 'neutral';

    const changes = [];
    for (let i = 1; i < Math.min(14, candles.length); i++) {
      changes.push(candles[i].close - candles[i - 1].close);
    }

    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0);
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0));

    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgGain / Math.max(avgLoss, 0.0001);
    const rsi = 100 - (100 / (1 + rs));

    if (rsi > 70) return 'strong_positive';
    if (rsi > 55) return 'positive';
    if (rsi < 30) return 'strong_negative';
    if (rsi < 45) return 'negative';
    return 'neutral';
  }

  /**
   * Calcular volatilidad (ATR)
   */
  private calculateVolatility(candles: CandleData[]): 'very_low' | 'low' | 'normal' | 'high' | 'very_high' {
    if (candles.length < 14) return 'normal';

    let sumTR = 0;
    for (let i = 1; i < Math.min(14, candles.length); i++) {
      const tr = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      );
      sumTR += tr;
    }

    const atr = sumTR / 14;
    const currentPrice = candles[candles.length - 1].close;
    const atrPercent = (atr / currentPrice) * 100;

    if (atrPercent < 0.5) return 'very_low';
    if (atrPercent < 1.0) return 'low';
    if (atrPercent < 2.5) return 'normal';
    if (atrPercent < 4.0) return 'high';
    return 'very_high';
  }

  /**
   * Determinar tendencia (SMA crossover simplificado)
   */
  private determineTrend(candles: CandleData[]): 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down' {
    if (candles.length < 20) return 'neutral';

    // SMA 10
    const sma10 = candles.slice(-10).reduce((sum, c) => sum + c.close, 0) / 10;
    // SMA 20
    const sma20 = candles.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20;

    const currentPrice = candles[candles.length - 1].close;
    const priceSMA10Diff = ((currentPrice - sma10) / sma10) * 100;
    const sma10SMA20Diff = ((sma10 - sma20) / sma20) * 100;

    if (priceSMA10Diff > 2 && sma10SMA20Diff > 1.5) return 'strong_up';
    if (priceSMA10Diff > 0.5 && sma10SMA20Diff > 0) return 'up';
    if (priceSMA10Diff < -2 && sma10SMA20Diff < -1.5) return 'strong_down';
    if (priceSMA10Diff < -0.5 && sma10SMA20Diff < 0) return 'down';
    return 'neutral';
  }

  /**
   * Encontrar patrones históricos similares
   */
  private findSimilarHistoricalPatterns(
    currentCandles: CandleData[],
    historicalCandles: CandleData[]
  ): { similarity: number; nextDirection: 'up' | 'down' | 'neutral'; movePercent: number } {
    // Obtener patrón actual (últimas 5 velas)
    const currentPattern = currentCandles.slice(-5);
    if (currentPattern.length < 5) {
      return { similarity: 0, nextDirection: 'neutral', movePercent: 0 };
    }

    let bestMatch = { similarity: 0, nextDirection: 'neutral' as 'up' | 'down' | 'neutral', movePercent: 0 };

    // Buscar en histórico
    for (let i = 5; i < Math.min(historicalCandles.length - 5, 200); i++) {
      const historicalPattern = historicalCandles.slice(i - 5, i);
      
      // Calcular similitud (comparar cambios porcentuales)
      let similarity = this.calculatePatternSimilarity(currentPattern, historicalPattern);
      
      if (similarity > bestMatch.similarity) {
        // Ver qué pasó después en histórico
        const nextCandles = historicalCandles.slice(i, Math.min(i + 5, historicalCandles.length));
        if (nextCandles.length > 0) {
          const movePercent = ((nextCandles[nextCandles.length - 1].close - historicalPattern[4].close) / historicalPattern[4].close) * 100;
          const direction = movePercent > 0 ? 'up' : 'down';

          bestMatch = {
            similarity,
            nextDirection: direction,
            movePercent: Math.abs(movePercent)
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calcular similitud entre dos patrones
   */
  private calculatePatternSimilarity(pattern1: CandleData[], pattern2: CandleData[]): number {
    if (pattern1.length !== pattern2.length || pattern1.length === 0) return 0;

    let totalDiff = 0;
    let count = 0;

    for (let i = 0; i < pattern1.length; i++) {
      // Comparar cambios porcentuales
      const change1 = i === 0 ? 0 : ((pattern1[i].close - pattern1[i - 1].close) / pattern1[i - 1].close) * 100;
      const change2 = i === 0 ? 0 : ((pattern2[i].close - pattern2[i - 1].close) / pattern2[i - 1].close) * 100;

      const diff = Math.abs(change1 - change2);
      totalDiff += diff;
      count++;
    }

    const avgDiff = totalDiff / count;
    // Convertir diferencia a similitud (0-100)
    const similarity = Math.max(0, 100 - avgDiff * 2);
    
    return similarity;
  }

  /**
   * Calcular soporte y resistencia
   */
  private calculateSupportResistance(
    currentCandles: CandleData[],
    historicalCandles: CandleData[]
  ): { support: number; resistance: number } {
    // Guard: Ensure we have at least some price data
    let currentPrice: number;
    
    if (currentCandles.length > 0) {
      currentPrice = currentCandles[currentCandles.length - 1].close;
    } else if (historicalCandles.length > 0) {
      // Fallback: use last historical candle as current price
      currentPrice = historicalCandles[historicalCandles.length - 1].close;
    } else {
      // No data available - throw clear error
      throw new Error('calculateSupportResistance requires either currentCandles or historicalCandles with data');
    }

    const allCandles = [...historicalCandles, ...currentCandles];
    const recentCandles = allCandles.slice(-50);

    if (recentCandles.length === 0) {
      // Should not happen given the guard above, but keep for safety
      return { support: currentPrice * 0.98, resistance: currentPrice * 1.02 };
    }

    const highs = recentCandles.map(c => c.high);
    const lows = recentCandles.map(c => c.low);

    // Buscar máximos y mínimos locales
    let resistance = Math.max(...highs);
    let support = Math.min(...lows);

    // Ajustar si están demasiado lejos
    if (resistance - currentPrice > currentPrice * 0.05) {
      resistance = currentPrice + (currentPrice * 0.03);
    }
    if (currentPrice - support > currentPrice * 0.05) {
      support = currentPrice - (currentPrice * 0.03);
    }

    return { support, resistance };
  }

  /**
   * Generar predicción final
   */
  private generatePrediction(
    timeframe: '4h' | '8h' | '24h',
    momentum: string,
    volatility: string,
    trend: string,
    historicalPattern: any,
    support: number,
    resistance: number,
    currentPrice: number
  ): IntradayPrediction {
    // Calcular probabilidad basada en factores
    let probabilityUp = 50;

    // Factor de momentum (+/- 15%)
    if (momentum === 'strong_positive') probabilityUp += 15;
    else if (momentum === 'positive') probabilityUp += 8;
    else if (momentum === 'negative') probabilityUp -= 8;
    else if (momentum === 'strong_negative') probabilityUp -= 15;

    // Factor de tendencia (+/- 20%)
    if (trend === 'strong_up') probabilityUp += 20;
    else if (trend === 'up') probabilityUp += 10;
    else if (trend === 'down') probabilityUp -= 10;
    else if (trend === 'strong_down') probabilityUp -= 20;

    // Factor de patrón histórico (+/- 10%)
    // Only apply if we have a strong match and meaningful direction (not neutral)
    if (historicalPattern.similarity > 70 && historicalPattern.nextDirection !== 'neutral') {
      if (historicalPattern.nextDirection === 'up') probabilityUp += 10;
      else if (historicalPattern.nextDirection === 'down') probabilityUp -= 10;
    }

    // Clamp entre 20-80 (evitar predicciones demasiado extremas)
    probabilityUp = Math.max(20, Math.min(80, probabilityUp));

    // Determinar dirección esperada
    const expectedDirection = probabilityUp > 55 ? 'up' : probabilityUp < 45 ? 'down' : 'neutral';

    // Calcular target de precio
    let priceTarget: number | null = null;
    let priceTargetPercent = 0;

    if (expectedDirection === 'up') {
      const targetLevel = support + (resistance - support) * 0.6;
      priceTarget = Math.max(currentPrice, targetLevel);
      priceTargetPercent = ((priceTarget - currentPrice) / currentPrice) * 100;
    } else if (expectedDirection === 'down') {
      const targetLevel = support + (resistance - support) * 0.4;
      priceTarget = Math.min(currentPrice, targetLevel);
      priceTargetPercent = ((priceTarget - currentPrice) / currentPrice) * 100;
    }

    // Ajustar por timeframe
    const timeframeMultiplier = timeframe === '4h' ? 1 : timeframe === '8h' ? 1.5 : 2;
    if (priceTargetPercent !== 0) {
      priceTargetPercent = priceTargetPercent * timeframeMultiplier;
      if (priceTarget) {
        priceTarget = currentPrice * (1 + priceTargetPercent / 100);
      }
    }

    // Generar reasoning
    const reasoning = `Predicción basada en: momentum ${momentum} (${probabilityUp > 55 ? '+' : ''}${Math.round(probabilityUp - 50)}%), ` +
      `tendencia ${trend}, patrón histórico ${Math.round(historicalPattern.similarity)}% similar. ` +
      `Target: ${priceTarget?.toFixed(2) || 'N/A'} (${priceTargetPercent > 0 ? '+' : ''}${priceTargetPercent.toFixed(2)}%)`;

    return {
      timeframe,
      expectedDirection,
      probability: ((probabilityUp - 20) / 60) * 100, // Properly scaled 0-100 from clamped range 20-80
      priceTarget,
      priceTargetPercent,
      factors: {
        momentum: momentum as any,
        volatility: volatility as any,
        trend: trend as any,
        patternMatch: historicalPattern.similarity,
        timeOfDay: this.getMarketTimeContext()
      },
      expectedLevels: { support, resistance },
      reasoning,
      timestamp: Date.now()
    };
  }

  /**
   * Obtener contexto de horario de mercado
   */
  private getMarketTimeContext(): string {
    const now = new Date();
    const utcHour = now.getUTCHours();

    if (utcHour >= 13 && utcHour < 21) return 'US Regular Hours (9:30-17:00 ET)';
    if (utcHour >= 21 || utcHour < 4) return 'After Hours / Pre-market';
    if (utcHour >= 8 && utcHour < 13) return 'European Markets';
    if (utcHour >= 4 && utcHour < 8) return 'Asian Markets';
    
    return 'Off-market hours';
  }
}

export const intradayPredictionService = new IntradayPredictionService();
export default intradayPredictionService;

