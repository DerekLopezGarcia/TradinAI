import { CandleData, TimeFrame } from '@/lib/types';
import { calculateRSI, calculateATR, calculateSMA } from '@/lib/indicators';
import { BaseService } from '@/lib/core/services';

export interface IntradayPrediction {
  timeframe: '4h' | '8h' | '24h';
  expectedDirection: 'up' | 'down' | 'neutral';
  probability: number;
  priceTarget: number | null;
  priceTargetPercent: number;
  factors: {
    momentum: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
    volatility: 'very_low' | 'low' | 'normal' | 'high' | 'very_high';
    trend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
    patternMatch: number;
    timeOfDay: string;
  };
  expectedLevels: {
    support: number;
    resistance: number;
  };
  reasoning: string;
  timestamp: number;
}

export interface PredictionMetrics {
  accuracy: number;
  precisionUp: number;
  precisionDown: number;
  averagePnl: number;
}

export class IntradayPredictionService extends BaseService {
  constructor() {
    super('IntradayPrediction');
  }
  public predictMovement(
    symbol: string,
    currentCandles: CandleData[],
    allHistoricalCandles: CandleData[],
    currentPrice: number,
    timeframe: TimeFrame = '1h'
  ): IntradayPrediction {
    let predictionTimeframe: '4h' | '8h' | '24h' = '4h';
    if (timeframe === '4h') {
      predictionTimeframe = '8h';
    } else if (timeframe === '1d' || timeframe === '1w') {
      predictionTimeframe = '24h';
    }

    const currentMomentum = this.calculateMomentum(currentCandles);
    const currentVolatility = this.calculateVolatility(currentCandles);
    const currentTrend = this.determineTrend(currentCandles);

    const historicalPattern = this.findSimilarHistoricalPatterns(
      currentCandles,
      allHistoricalCandles
    );

    const { support, resistance } = this.calculateSupportResistance(
      currentCandles,
      allHistoricalCandles
    );

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

  private calculateMomentum(candles: CandleData[]): 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative' {
    if (candles.length < 14) return 'neutral';

    const closes = candles.map(c => c.close);
    const rsiValues = calculateRSI(closes, 14);
    const lastRSI = rsiValues[rsiValues.length - 1];

    if (isNaN(lastRSI)) return 'neutral';

    if (lastRSI > 70) return 'strong_positive';
    if (lastRSI > 55) return 'positive';
    if (lastRSI < 30) return 'strong_negative';
    if (lastRSI < 45) return 'negative';
    return 'neutral';
  }

  private calculateVolatility(candles: CandleData[]): 'very_low' | 'low' | 'normal' | 'high' | 'very_high' {
    if (candles.length < 14) return 'normal';

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);
    const atrValues = calculateATR(highs, lows, closes, 14);
    const lastATR = atrValues[atrValues.length - 1];

    if (isNaN(lastATR)) return 'normal';

    const currentPrice = candles[candles.length - 1].close;
    const atrPercent = (lastATR / currentPrice) * 100;

    if (atrPercent < 0.5) return 'very_low';
    if (atrPercent < 1.0) return 'low';
    if (atrPercent < 2.5) return 'normal';
    if (atrPercent < 4.0) return 'high';
    return 'very_high';
  }

  private determineTrend(candles: CandleData[]): 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down' {
    if (candles.length < 20) return 'neutral';

    const closes = candles.map(c => c.close);
    const sma10 = calculateSMA(closes, 10);
    const sma20 = calculateSMA(closes, 20);

    const lastSMA10 = sma10[sma10.length - 1];
    const lastSMA20 = sma20[sma20.length - 1];

    const currentPrice = candles[candles.length - 1].close;
    const priceSMA10Diff = ((currentPrice - lastSMA10) / lastSMA10) * 100;
    const sma10SMA20Diff = ((lastSMA10 - lastSMA20) / lastSMA20) * 100;

    if (priceSMA10Diff > 2 && sma10SMA20Diff > 1.5) return 'strong_up';
    if (priceSMA10Diff > 0.5 && sma10SMA20Diff > 0) return 'up';
    if (priceSMA10Diff < -2 && sma10SMA20Diff < -1.5) return 'strong_down';
    if (priceSMA10Diff < -0.5 && sma10SMA20Diff < 0) return 'down';
    return 'neutral';
  }

  private findSimilarHistoricalPatterns(
    currentCandles: CandleData[],
    historicalCandles: CandleData[]
  ): { similarity: number; nextDirection: 'up' | 'down' | 'neutral'; movePercent: number } {
    const currentPattern = currentCandles.slice(-5);
    if (currentPattern.length < 5) {
      return { similarity: 0, nextDirection: 'neutral', movePercent: 0 };
    }

    let bestMatch = { similarity: 0, nextDirection: 'neutral' as 'up' | 'down' | 'neutral', movePercent: 0 };

    const maxLookback = Math.min(historicalCandles.length - 5, 500);
    for (let i = 5; i < maxLookback; i++) {
      const historicalPattern = historicalCandles.slice(i - 5, i);

      let similarity = this.calculatePatternSimilarity(currentPattern, historicalPattern);

      if (similarity > bestMatch.similarity) {
        const nextCandles = historicalCandles.slice(i, Math.min(i + 5, historicalCandles.length));
        if (nextCandles.length > 0) {
          const movePercent = ((nextCandles[nextCandles.length - 1].close - historicalPattern[4].close) / historicalPattern[4].close) * 100;
          const direction: 'up' | 'down' | 'neutral' =
            movePercent > 0.01 ? 'up' : movePercent < -0.01 ? 'down' : 'neutral';

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

  private calculatePatternSimilarity(pattern1: CandleData[], pattern2: CandleData[]): number {
    if (pattern1.length !== pattern2.length || pattern1.length === 0) return 0;

    let totalDiff = 0;
    let count = 0;

    for (let i = 0; i < pattern1.length; i++) {
      const change1 = i === 0 ? 0 : ((pattern1[i].close - pattern1[i - 1].close) / pattern1[i - 1].close) * 100;
      const change2 = i === 0 ? 0 : ((pattern2[i].close - pattern2[i - 1].close) / pattern2[i - 1].close) * 100;

      const diff = Math.abs(change1 - change2);
      totalDiff += diff;
      count++;
    }

    const avgDiff = totalDiff / count;
    const similarity = Math.max(0, 100 - avgDiff * 2);

    return similarity;
  }

  private calculateSupportResistance(
    currentCandles: CandleData[],
    historicalCandles: CandleData[]
  ): { support: number; resistance: number } {
    let currentPrice: number;

    if (currentCandles.length > 0) {
      currentPrice = currentCandles[currentCandles.length - 1].close;
    } else if (historicalCandles.length > 0) {
      currentPrice = historicalCandles[historicalCandles.length - 1].close;
    } else {
      throw new Error('calculateSupportResistance requires either currentCandles or historicalCandles with data');
    }

    const allCandles = [...historicalCandles, ...currentCandles];
    const recentCandles = allCandles.slice(-50);

    if (recentCandles.length === 0) {
      return { support: currentPrice * 0.98, resistance: currentPrice * 1.02 };
    }

    const highs = recentCandles.map(c => c.high);
    const lows = recentCandles.map(c => c.low);

    let resistance = Math.max(...highs);
    let support = Math.min(...lows);

    if (resistance - currentPrice > currentPrice * 0.05) {
      resistance = currentPrice + (currentPrice * 0.03);
    }
    if (currentPrice - support > currentPrice * 0.05) {
      support = currentPrice - (currentPrice * 0.03);
    }

    return { support, resistance };
  }

  private generatePrediction(
    timeframe: '4h' | '8h' | '24h',
    momentum: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative',
    volatility: 'very_low' | 'low' | 'normal' | 'high' | 'very_high',
    trend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down',
    historicalPattern: { similarity: number; nextDirection: 'up' | 'down' | 'neutral'; movePercent: number },
    support: number,
    resistance: number,
    currentPrice: number
  ): IntradayPrediction {
    let probabilityUp = 50;

    if (momentum === 'strong_positive') probabilityUp += 15;
    else if (momentum === 'positive') probabilityUp += 8;
    else if (momentum === 'negative') probabilityUp -= 8;
    else if (momentum === 'strong_negative') probabilityUp -= 15;

    if (trend === 'strong_up') probabilityUp += 20;
    else if (trend === 'up') probabilityUp += 10;
    else if (trend === 'down') probabilityUp -= 10;
    else if (trend === 'strong_down') probabilityUp -= 20;

    if (volatility === 'high' || volatility === 'very_high') {
      probabilityUp *= 0.9;
    } else if (volatility === 'very_low') {
      probabilityUp *= 1.1;
    }
    probabilityUp = Math.round(probabilityUp);

    if (historicalPattern.similarity > 70 && historicalPattern.nextDirection !== 'neutral') {
      if (historicalPattern.nextDirection === 'up') probabilityUp += 10;
      else if (historicalPattern.nextDirection === 'down') probabilityUp -= 10;
    }

    probabilityUp = Math.max(20, Math.min(80, probabilityUp));

    const expectedDirection = probabilityUp > 55 ? 'up' : probabilityUp < 45 ? 'down' : 'neutral';

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

    const timeframeMultiplier = timeframe === '4h' ? 1 : timeframe === '8h' ? 1.5 : 2;
    if (priceTargetPercent !== 0) {
      priceTargetPercent = priceTargetPercent * timeframeMultiplier;
      if (priceTarget) {
        priceTarget = currentPrice * (1 + priceTargetPercent / 100);
      }
    }

    const reasoning = `Predicción basada en: momentum ${momentum} (${probabilityUp > 55 ? '+' : ''}${Math.round(probabilityUp - 50)}%), ` +
      `tendencia ${trend}, volatilidad ${volatility}, patrón histórico ${Math.round(historicalPattern.similarity)}% similar. ` +
      `Target: ${priceTarget?.toFixed(2) || 'N/A'} (${priceTargetPercent > 0 ? '+' : ''}${priceTargetPercent.toFixed(2)}%)`;

    return {
      timeframe,
      expectedDirection,
      probability: ((probabilityUp - 20) / 60) * 100,
      priceTarget,
      priceTargetPercent,
      factors: {
        momentum,
        volatility,
        trend,
        patternMatch: historicalPattern.similarity,
        timeOfDay: this.getMarketTimeContext()
      },
      expectedLevels: { support, resistance },
      reasoning,
      timestamp: Date.now()
    };
  }

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
