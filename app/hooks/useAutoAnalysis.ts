/**
 * Hook para análisis manual de velas con explicaciones detalladas
 * Se ejecuta solo cuando se llama manualmente a través de runAnalysis()
 * 
 * T1.1 Optimizaciones implementadas:
 * - Cache automático en candleAnalysisService (30s TTL)
 * - Paralelización de indicadores independientes
 * - Memoization de explicaciones generadas
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import {
  CandleAnalysisResponse,
  CandleAnalyzer,
  CandleAnalysisInput,
  CandlePattern,
  IndicatorStatus,
  KeyLevels,
  Prediction,
  TrendAnalysis,
  NewsImpact,
  analyzeCandles,
} from '@/lib/services/candleAnalysisService';
import { t } from '@/lib/i18n/t';

export interface AnalysisExplanation {
  analysis: CandleAnalysisResponse | null;
  explanation: {
    tendencyReason: string;
    patternsReason: string;
    indicatorsReason: string;
    predictionsReason: string;
    riskReason: string;
    newsReason: string;
    summary: string;
  };
  isLoading: boolean;
  error: string | null;
  newsImpact: NewsImpact | null;
  runAnalysis: (symbol: string, timeframe: TimeFrame, candleData: CandleData[], analysisDepth?: 'basic' | 'standard' | 'comprehensive', includeNews?: boolean) => Promise<void>;
}

/**
 * Hook que permite ejecutar análisis manual de velas bajo demanda
 * y proporciona explicaciones detalladas
 */
export function useAutoAnalysis(
  symbol: string,
  timeframe: TimeFrame,
  candleData: CandleData[],
  analysisDepth: 'basic' | 'standard' | 'comprehensive' = 'standard',
  includeNews: boolean = false,
  autoRun: boolean = false
): AnalysisExplanation {
  const [analysis, setAnalysis] = useState<CandleAnalysisResponse | null>(null);
  const [newsImpact, setNewsImpact] = useState<NewsImpact | null>(null);
  const [hasRun, setHasRun] = useState(false);

  // Run analysis automatically when enough data is available
  useEffect(() => {
    if (autoRun && candleData.length >= 20 && !hasRun && !analysis) {
      runAnalysis(symbol, timeframe, candleData, analysisDepth, includeNews);
      setHasRun(true);
    }
  }, [autoRun, candleData.length, symbol, timeframe]);
  const [explanation, setExplanation] = useState({
    tendencyReason: '',
    patternsReason: '',
    indicatorsReason: '',
    predictionsReason: '',
    riskReason: '',
    newsReason: '',
    summary: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para generar explicación del análisis
  const generateExplanation = useCallback((analysisResult: CandleAnalysisResponse) => {
    try {
      const trend = analysisResult.summary.trend;
      const patterns = analysisResult.patterns;
      const indicators = analysisResult.indicatorStatus;
      const prediction = analysisResult.mainPrediction;
      const riskFactors = analysisResult.riskFactors;

      // Explicación de la tendencia
      const tendencyReason = generateTrendExplanation(
        analysisResult.trendAnalysis,
        trend
      );

      // Explicación de patrones
      const patternsReason = generatePatternsExplanation(patterns);

      // Explicación de indicadores
      const indicatorsReason = generateIndicatorsExplanation(indicators);

      // Explicación de predicciones
      const predictionsReason = generatePredictionExplanation(prediction);

      // Explicación de riesgos
      const riskReason = generateRiskExplanation(riskFactors);

      // Explicación de noticias
      const newsReason = generateNewsExplanation(analysisResult.newsImpact);

      // Resumen ejecutivo
      const summary = generateExecutiveSummary(
        trend,
        patterns,
        prediction,
        analysisResult.summary
      );

      setExplanation({
        tendencyReason,
        patternsReason,
        indicatorsReason,
        predictionsReason,
        riskReason,
        newsReason,
        summary
      });
    } catch (err) {
      console.error('Error generating explanation:', err);
      setError('Error generating analysis explanation');
    }
  }, []);

  // Función para ejecutar análisis manualmente
  const runAnalysis = useCallback(async (
    sym: string,
    tf: TimeFrame,
    data: CandleData[],
    depth: 'basic' | 'standard' | 'comprehensive' = 'standard',
    newsEnabled: boolean = false
  ) => {
    if (!data || data.length < 20) {
      setError('At least 20 candles are required for analysis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch news if requested
      let relatedNews;
      if (newsEnabled) {
        try {
          const params = new URLSearchParams({ symbol: sym, type: 'news' });
          const res = await fetch(`/api/market?${params.toString()}`);
          if (res.ok) {
            const newsData = await res.json();
            relatedNews = newsData.news || [];
          }
        } catch (e) {
          console.warn('News fetch failed:', e);
        }
      }

      const result = await analyzeCandles({
        symbol: sym,
        timeframe: tf,
        candles: data,
        analysisDepth: depth,
        relatedNews,
      });

      setAnalysis(result);
      setNewsImpact(result.newsImpact || null);
      generateExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis error');
      setAnalysis(null);
      setNewsImpact(null);
    } finally {
      setIsLoading(false);
    }
  }, [generateExplanation]);

  return {
    analysis,
    explanation,
    isLoading,
    error,
    newsImpact,
    runAnalysis
  };
}

// ==================== Explanation Generation Functions ====================

function translateDirection(dir: string): string {
  const m: Record<string, string> = {
    alcista: 'Bullish', bajista: 'Bearish', lateral: 'Lateral',
    bullish: 'Bullish', bearish: 'Bearish',
    arriba: 'above', abajo: 'below',
  };
  return m[dir] ?? dir;
}

function generateTrendExplanation(trendAnalysis: TrendAnalysis, trend: string): string {
  const { direction, structure, strength, adx, sma, ema } = trendAnalysis;
  const trendDisplay = translateDirection(trend);
  let explanation = t('explain.trendHeader', { trend: trendDisplay.toUpperCase() }) + '\n\n';
  explanation += t('explain.marketStructure', { structure }) + '\n\n';

  if (trend === 'alcista') {
    explanation += t('explain.trendDescBullish') + '\n\n';
  } else if (trend === 'bajista') {
    explanation += t('explain.trendDescBearish') + '\n\n';
  } else {
    explanation += t('explain.trendDescLateral') + '\n\n';
  }

  explanation += t('explain.trendStrength', { strength }) + '\n';
  if (strength > 75) {
    explanation += t('explain.trendStrengthHigh', { strength }) + '\n\n';
  } else if (strength > 50) {
    explanation += t('explain.trendStrengthModerate', { strength }) + '\n\n';
  } else {
    explanation += t('explain.trendStrengthLow', { strength }) + '\n\n';
  }

  explanation += t('explain.trendAdx', { adx: adx.toFixed(2) }) + '\n';
  if (adx > 25) {
    explanation += t('explain.trendAdxStrong') + '\n\n';
  } else if (adx > 20) {
    explanation += t('explain.trendAdxModerate') + '\n\n';
  } else {
    explanation += t('explain.trendAdxWeak') + '\n\n';
  }

  explanation += t('explain.trendMA') + '\n';
  sma.forEach((m: { period: number; price: number; direction: string }) => {
    const relation = t(m.direction === 'arriba' ? 'explain.trendSmaAbove' : 'explain.trendSmaBelow');
    explanation += t('explain.trendSmaLine', { period: m.period, relation, price: m.price.toFixed(2) }) + '\n';
  });

  return explanation;
}

function generatePatternsExplanation(patterns: CandlePattern[]): string {
  let explanation = t('explain.patternsHeader') + '\n\n';

  if (patterns.length === 0) {
    explanation += t('explain.patternsEmpty') + '\n';
    return explanation;
  }

  patterns.slice(0, 5).forEach((pattern, idx) => {
    const type = pattern.type.replace('_', ' ');
    explanation += `${idx + 1}. **${pattern.name.toUpperCase()}** (${type})\n`;
    explanation += `   - ${t(pattern.description)}\n`;
    explanation += `   - ${t('analysis.confidence')}: ${pattern.reliability}%\n`;

    if (pattern.type === 'bullish_reversal') {
      explanation += `   - ${t('explain.patternSignalBullish')}\n`;
    } else if (pattern.type === 'bearish_reversal') {
      explanation += `   - ${t('explain.patternSignalBearish')}\n`;
    } else if (pattern.type === 'continuation') {
      explanation += `   - ${t('explain.patternSignalContinue')}\n`;
    } else {
      explanation += `   - ${t('explain.patternSignalIndecision')}\n`;
    }

    explanation += '\n';
  });

  return explanation;
}

function generateIndicatorsExplanation(indicators: IndicatorStatus): string {
  let explanation = t('explain.indicatorsHeader') + '\n\n';

  explanation += t('explain.indicatorsRsi') + '\n';
  explanation += t('explain.indicatorsRsiValue', { value: indicators.rsi.value.toFixed(2) }) + '\n';
  if (indicators.rsi.status === 'overbought') {
    explanation += t('explain.indicatorsRsiOverbought') + '\n';
  } else if (indicators.rsi.status === 'oversold') {
    explanation += t('explain.indicatorsRsiOversold') + '\n';
  } else {
    explanation += t('explain.indicatorsRsiNeutral') + '\n';
  }
  explanation += '\n';

  explanation += t('explain.indicatorsMacd') + '\n';
  explanation += t('explain.indicatorsMacdValue', {
    value: indicators.macd.value.toFixed(4),
    signal: indicators.macd.signal.toFixed(4),
    histogram: indicators.macd.histogram.toFixed(4),
  }) + '\n';
  if (indicators.macd.status === 'bullish') {
    explanation += t('explain.indicatorsMacdBullish') + '\n';
  } else {
    explanation += t('explain.indicatorsMacdBearish') + '\n';
  }
  explanation += '\n';

  explanation += t('explain.indicatorsBollinger') + '\n';
  explanation += t('explain.indicatorsBollingerValue', {
    upper: indicators.bollingerBands.upper.toFixed(2),
    middle: indicators.bollingerBands.middle.toFixed(2),
    lower: indicators.bollingerBands.lower.toFixed(2),
    position: indicators.bollingerBands.position,
  }) + '\n';
  if (indicators.bollingerBands.position === 'above_upper') {
    explanation += t('explain.indicatorsBollingerAbove') + '\n';
  } else if (indicators.bollingerBands.position === 'below_lower') {
    explanation += t('explain.indicatorsBollingerBelow') + '\n';
  } else {
    explanation += t('explain.indicatorsBollingerInside') + '\n';
  }
  explanation += '\n';

  explanation += t('explain.indicatorsStochastic') + '\n';
  explanation += t('explain.indicatorsStochasticValue', {
    k: indicators.stochastic.k.toFixed(2),
    d: indicators.stochastic.d.toFixed(2),
    status: indicators.stochastic.status,
  }) + '\n';
  if (indicators.stochastic.status === 'overbought') {
    explanation += t('explain.indicatorsStochasticOverbought') + '\n';
  } else if (indicators.stochastic.status === 'oversold') {
    explanation += t('explain.indicatorsStochasticOversold') + '\n';
  } else {
    explanation += t('explain.indicatorsStochasticNeutral') + '\n';
  }
  explanation += '\n';

  explanation += t('explain.indicatorsAtr') + '\n';
  explanation += t('explain.indicatorsAtrValue', { atr: indicators.atr.toFixed(4) }) + '\n';
  explanation += t('explain.indicatorsAtrHigh') + ' ';
  explanation += t('explain.indicatorsAtrLow') + '\n';

  return explanation;
}

function generatePredictionExplanation(prediction: Prediction): string {
  const dirDisplay = translateDirection(prediction.direction);
  const rw = prediction.riskReward.toFixed(2);

  let explanation = t('explain.predictionHeader') + '\n\n';
  explanation += t('explain.predictionDirection', { direction: dirDisplay }) + '\n';
  explanation += t('explain.predictionProbability', { probability: prediction.probability }) + '\n';
  explanation += t('explain.predictionConfidence', { confidence: prediction.confidenceLevel.toUpperCase() }) + '\n\n';
  explanation += t('explain.predictionAnalysis', { direction: dirDisplay, probability: prediction.probability }) + '\n\n';

  explanation += t('explain.predictionTargets') + '\n';
  prediction.targetPrice.forEach((target: number, idx: number) => {
    explanation += t('explain.predictionTarget', { idx: idx + 1, target: target.toFixed(2) }) + '\n';
  });

  explanation += '\n' + t('explain.predictionStopLoss', { value: prediction.stopLoss.toFixed(2) }) + '\n';
  explanation += t('explain.predictionStopLossNote') + '\n\n';

  explanation += t('explain.predictionRR', { value: rw }) + '\n';
  if (prediction.riskReward > 2) {
    explanation += t('explain.predictionRRExcellent', { value: rw }) + '\n';
  } else if (prediction.riskReward > 1) {
    explanation += t('explain.predictionRRGood', { value: rw }) + '\n';
  } else {
    explanation += t('explain.predictionRRPoor', { value: rw }) + '\n';
  }

  explanation += '\n' + t('explain.predictionHorizon', { horizon: prediction.timeHorizon }) + '\n';
  explanation += t('explain.predictionHorizonNote') + '\n';

  return explanation;
}

function generateRiskExplanation(riskFactors: string[]): string {
  let explanation = t('explain.riskHeader') + '\n\n';

  if (riskFactors.length === 0) {
    explanation += t('explain.riskEmpty') + '\n';
    return explanation;
  }

  riskFactors.forEach((risk, idx) => {
    explanation += `${idx + 1}. ⚠️ ${t(risk)}\n`;
  });

  return explanation;
}

function generateNewsExplanation(newsImpact: NewsImpact | undefined): string {
  if (!newsImpact) return '';

  let explanation = t('explain.newsHeader') + '\n\n';

  const directionLabel = translateDirection(newsImpact.dominantDirection === 'bullish' ? 'alcista' :
    newsImpact.dominantDirection === 'bearish' ? 'bajista' : 'lateral');
  const scoreEmoji = newsImpact.overallSentimentScore > 0.3 ? '🟢' : newsImpact.overallSentimentScore < -0.3 ? '🔴' : '🟡';

  explanation += t('explain.newsSentiment', { emoji: scoreEmoji, score: newsImpact.overallSentimentScore.toFixed(2), direction: directionLabel }) + '\n';
  explanation += t('explain.newsConfidence', { confidence: newsImpact.confidence }) + '\n';
  explanation += t('explain.newsImpact', { impact: newsImpact.impactLevel.toUpperCase() }) + '\n';
  explanation += t('explain.newsArticles', { count: newsImpact.articleCount }) + '\n\n';

  if (newsImpact.dominantDirection === 'bullish' && newsImpact.impactLevel === 'high') {
    explanation += t('explain.newsBullishHigh') + '\n';
  } else if (newsImpact.dominantDirection === 'bearish' && newsImpact.impactLevel === 'high') {
    explanation += t('explain.newsBearishHigh') + '\n';
  } else if (newsImpact.dominantDirection !== 'neutral') {
    explanation += t('explain.newsDirection', { direction: directionLabel }) + '\n';
  } else {
    explanation += t('explain.newsNeutral') + '\n';
  }

  return explanation;
}

function generateExecutiveSummary(
  trend: string,
  patterns: CandlePattern[],
  prediction: Prediction,
  summary: CandleAnalysisResponse['summary']
): string {
  const dirDisplay = translateDirection(prediction.direction);
  const trendDisplay = translateDirection(trend);

  let text = t('explain.summaryHeader') + '\n\n';
  text += t('explain.summaryTrend', { trend: trendDisplay.toUpperCase() }) + '\n';
  text += t('explain.summaryBias', { bias: summary.bias }) + '\n';
  text += t('explain.summarySentiment', { sentiment: t(summary.overallSentiment) }) + '\n';
  text += t('explain.summaryPatterns', { count: patterns.length }) + '\n';
  text += t('explain.summaryPrediction', { direction: dirDisplay.toUpperCase(), probability: prediction.probability }) + '\n\n';

  text += t('explain.summarySynthesis', { trend: trendDisplay }) + ' ';

  if (patterns.length > 2) {
    text += t('explain.summarySynthesisMultiPattern') + ' ';
  } else if (patterns.length > 0) {
    text += t('explain.summarySynthesisSomePattern') + ' ';
  }

  text += t('explain.summarySynthesisEnd', { direction: dirDisplay, confidence: prediction.confidenceLevel }) + '\n';

  return text;
}

