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

import { useState, useCallback } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import { analyzeCandles } from '@/lib/services/candleAnalysisService';

export interface AnalysisExplanation {
  analysis: any;
  explanation: {
    tendencyReason: string;
    patternsReason: string;
    indicatorsReason: string;
    predictionsReason: string;
    riskReason: string;
    summary: string;
  };
  isLoading: boolean;
  error: string | null;
  runAnalysis: (symbol: string, timeframe: TimeFrame, candleData: CandleData[], analysisDepth?: 'basic' | 'standard' | 'comprehensive') => Promise<void>;
}

/**
 * Hook que permite ejecutar análisis manual de velas bajo demanda
 * y proporciona explicaciones detalladas
 */
export function useAutoAnalysis(
  symbol: string,
  timeframe: TimeFrame,
  candleData: CandleData[],
  analysisDepth: 'basic' | 'standard' | 'comprehensive' = 'standard'
): AnalysisExplanation {
  const [analysis, setAnalysis] = useState<any>(null);
  const [explanation, setExplanation] = useState({
    tendencyReason: '',
    patternsReason: '',
    indicatorsReason: '',
    predictionsReason: '',
    riskReason: '',
    summary: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para generar explicación del análisis
  const generateExplanation = useCallback((analysisResult: any) => {
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
        summary
      });
    } catch (err) {
      console.error('Error generando explicación:', err);
      setError('Error generando explicación del análisis');
    }
  }, []);

  // Función para ejecutar análisis manualmente
  const runAnalysis = useCallback(async (
    sym: string,
    tf: TimeFrame,
    data: CandleData[],
    depth: 'basic' | 'standard' | 'comprehensive' = 'standard'
  ) => {
    if (!data || data.length < 20) {
      setError('Se requieren al menos 20 velas para análisis');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeCandles({
        symbol: sym,
        timeframe: tf,
        candles: data,
        analysisDepth: depth
      });

      setAnalysis(result);
      generateExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en análisis');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [generateExplanation]);

  return {
    analysis,
    explanation,
    isLoading,
    error,
    runAnalysis
  };
}

// ==================== Funciones de Generación de Explicaciones ====================

function generateTrendExplanation(trendAnalysis: any, trend: string): string {
  const { direction, structure, strength, adx, sma, ema } = trendAnalysis;

  let explanation = `**ANÁLISIS DE TENDENCIA (${trend.toUpperCase()})**\n\n`;

  explanation += `📊 **Estructura del Mercado**: ${structure}\n\n`;

  explanation += `La estructura mostrada indica un mercado `;
  if (trend === 'alcista') {
    explanation += `**alcista fuerte** donde los máximos y mínimos van subiendo secuencialmente. `;
    explanation += `Esto significa que los compradores mantienen el control y están empujando el precio hacia arriba.\n\n`;
  } else if (trend === 'bajista') {
    explanation += `**bajista fuerte** donde los máximos y mínimos van bajando secuencialmente. `;
    explanation += `Esto indica que los vendedores tienen control y están presionando el precio hacia abajo.\n\n`;
  } else {
    explanation += `**lateral o sin tendencia clara**. El mercado está indeciso entre compradores y vendedores.\n\n`;
  }

  explanation += `💪 **Fuerza de la Tendencia**: ${strength}/100\n`;
  if (strength > 75) {
    explanation += `Una fuerza muy alta (${strength}%) indica una tendencia **muy sólida** que probablemente continuará. `;
  } else if (strength > 50) {
    explanation += `Una fuerza moderada (${strength}%) sugiere una tendencia **establecida pero no extrema**. `;
  } else {
    explanation += `Una fuerza baja (${strength}%) indica una tendencia **débil** que podría cambiar pronto. `;
  }
  explanation += `\n\n`;

  explanation += `📈 **ADX (Fuerza Direccional)**: ${adx.toFixed(2)}\n`;
  if (adx > 25) {
    explanation += `ADX > 25 confirma que hay una **tendencia fuerte y confiable**. Los movimientos del precio son más predecibles.\n\n`;
  } else if (adx > 20) {
    explanation += `ADX entre 20-25 sugiere una **tendencia moderada** que está estableciéndose.\n\n`;
  } else {
    explanation += `ADX < 20 indica un **mercado lateral** sin tendencia definida. Es un período de consolidación.\n\n`;
  }

  explanation += `🎯 **Medias Móviles**:\n`;
  sma.forEach((m: any) => {
    const relation = m.direction === 'arriba' ? '📈 por encima' : '📉 por debajo';
    explanation += `- SMA ${m.period}: Precio ${relation} (${m.price.toFixed(2)})\n`;
  });

  return explanation;
}

function generatePatternsExplanation(patterns: any[]): string {
  let explanation = `**PATRONES DE VELAS IDENTIFICADOS**\n\n`;

  if (patterns.length === 0) {
    explanation += `No se identificaron patrones significativos en el período analizado.\n`;
    explanation += `El mercado podría estar en fase de consolidación.\n`;
    return explanation;
  }

  patterns.slice(0, 5).forEach((pattern, idx) => {
    explanation += `${idx + 1}. **${pattern.name.toUpperCase()}** (${pattern.type.replace('_', ' ')})\n`;
    explanation += `   - ${pattern.description}\n`;
    explanation += `   - Confiabilidad: ${pattern.reliability}%\n`;

    if (pattern.type === 'bullish_reversal') {
      explanation += `   - 🔼 Señal: Potencial **cambio a alcista** o continuación del alza\n`;
    } else if (pattern.type === 'bearish_reversal') {
      explanation += `   - 🔽 Señal: Potencial **cambio a bajista** o continuación de la baja\n`;
    } else if (pattern.type === 'continuation') {
      explanation += `   - ➡️ Señal: Probable **continuación** de la tendencia actual\n`;
    } else {
      explanation += `   - ❓ Señal: Indica **indecisión** del mercado\n`;
    }

    explanation += `\n`;
  });

  return explanation;
}

function generateIndicatorsExplanation(indicators: any): string {
  let explanation = `**ANÁLISIS DE INDICADORES TÉCNICOS**\n\n`;

  // RSI
  explanation += `📊 **RSI (Índice de Fuerza Relativa)**\n`;
  explanation += `Valor: ${indicators.rsi.value.toFixed(2)}\n`;
  if (indicators.rsi.status === 'overbought') {
    explanation += `⚠️ **SOBRECOMPRA**: RSI > 70 indica que el activo está sobrevaluado. `;
    explanation += `Los compradores han sido muy agresivos y es probable una corrección a la baja.\n`;
  } else if (indicators.rsi.status === 'oversold') {
    explanation += `✅ **SOBREVENTA**: RSI < 30 indica que el activo está subvaluado. `;
    explanation += `Los vendedores han sido muy agresivos y es probable un rebote al alza.\n`;
  } else {
    explanation += `⚖️ **NEUTRAL**: RSI en zona normal (30-70) indica equilibrio entre compradores y vendedores.\n`;
  }
  explanation += `\n`;

  // MACD
  explanation += `📈 **MACD (Convergencia-Divergencia de Medias Móviles)**\n`;
  explanation += `Valor: ${indicators.macd.value.toFixed(4)} | Signal: ${indicators.macd.signal.toFixed(4)} | Histogram: ${indicators.macd.histogram.toFixed(4)}\n`;
  if (indicators.macd.status === 'bullish') {
    explanation += `🟢 **BULLISH**: MACD está por encima de su línea de señal. Esto indica **momentum alcista**. `;
    explanation += `Es una señal de compra cuando ocurre.\n`;
  } else {
    explanation += `🔴 **BEARISH**: MACD está por debajo de su línea de señal. Esto indica **momentum bajista**. `;
    explanation += `Es una señal de venta cuando ocurre.\n`;
  }
  explanation += `\n`;

  // Bollinger Bands
  explanation += `📊 **Bollinger Bands (Bandas de Volatilidad)**\n`;
  explanation += `Banda Superior: ${indicators.bollingerBands.upper.toFixed(2)}\n`;
  explanation += `Banda Media: ${indicators.bollingerBands.middle.toFixed(2)}\n`;
  explanation += `Banda Inferior: ${indicators.bollingerBands.lower.toFixed(2)}\n`;
  explanation += `Posición: ${indicators.bollingerBands.position}\n`;

  if (indicators.bollingerBands.position === 'above_upper') {
    explanation += `📍 El precio está **por encima de la banda superior**, lo que indica **sobrecompra extrema**. `;
    explanation += `Es probable una corrección o consolidación.\n`;
  } else if (indicators.bollingerBands.position === 'below_lower') {
    explanation += `📍 El precio está **por debajo de la banda inferior**, lo que indica **sobreventa extrema**. `;
    explanation += `Es probable un rebote hacia arriba.\n`;
  } else {
    explanation += `📍 El precio está **dentro de las bandas**, lo que indica un **rango normal de volatilidad**.\n`;
  }
  explanation += `\n`;

  // Stochastic
  explanation += `🔄 **Stochastic (Oscilador Estocástico)**\n`;
  explanation += `%K: ${indicators.stochastic.k.toFixed(2)} | %D: ${indicators.stochastic.d.toFixed(2)}\n`;
  explanation += `Estado: ${indicators.stochastic.status}\n`;
  if (indicators.stochastic.status === 'overbought') {
    explanation += `El Stochastic está en zona de sobrecompra (>80). Anticipa correcciones bajistas.\n`;
  } else if (indicators.stochastic.status === 'oversold') {
    explanation += `El Stochastic está en zona de sobreventa (<20). Anticipa rebotes alcistas.\n`;
  } else {
    explanation += `El Stochastic está en zona neutral, sin señales extremas.\n`;
  }
  explanation += `\n`;

  // ATR
  explanation += `📏 **ATR (Rango Promedio Real)**\n`;
  explanation += `Volatilidad: ${indicators.atr.toFixed(4)}\n`;
  explanation += `Un ATR alto indica **volatilidad elevada** (movimientos grandes). `;
  explanation += `Un ATR bajo indica **volatilidad baja** (movimientos pequeños).\n`;

  return explanation;
}

function generatePredictionExplanation(prediction: any): string {
  let explanation = `**PREDICCIÓN Y OBJETIVOS**\n\n`;

  explanation += `🎯 **Dirección Predicha**: ${prediction.direction.toUpperCase()}\n`;
  explanation += `📊 **Probabilidad**: ${prediction.probability}%\n`;
  explanation += `💪 **Nivel de Confianza**: ${prediction.confidenceLevel.toUpperCase()}\n\n`;

  explanation += `Basado en todos los análisis anteriores (tendencia, patrones, indicadores), `;
  explanation += `el sistema predice un movimiento **${prediction.direction}** con un ${prediction.probability}% de probabilidad.\n\n`;

  explanation += `🎯 **Objetivos de Precio**:\n`;
  prediction.targetPrice.forEach((target: number, idx: number) => {
    explanation += `${idx + 1}. Objetivo: ${target.toFixed(2)} (Ganancia potencial)\n`;
  });

  explanation += `\n🛑 **Stop Loss**: ${prediction.stopLoss.toFixed(2)}\n`;
  explanation += `Si el precio cae por debajo de este nivel, la predicción se anula.\n\n`;

  explanation += `📈 **Relación Riesgo/Beneficio**: ${prediction.riskReward.toFixed(2)}\n`;
  if (prediction.riskReward > 2) {
    explanation += `Una relación R/R de ${prediction.riskReward.toFixed(2)} es **excelente**. `;
    explanation += `Por cada unidad de riesgo, ganamos ${prediction.riskReward.toFixed(2)} unidades.\n`;
  } else if (prediction.riskReward > 1) {
    explanation += `Una relación R/R de ${prediction.riskReward.toFixed(2)} es **buena**. `;
    explanation += `El riesgo/beneficio es favorable.\n`;
  } else {
    explanation += `Una relación R/R de ${prediction.riskReward.toFixed(2)} es **pobre**. `;
    explanation += `El riesgo es mayor que el beneficio potencial.\n`;
  }

  explanation += `\n⏱️ **Horizonte Temporal**: ${prediction.timeHorizon}\n`;
  explanation += `Se espera que este análisis sea válido por el período mencionado.\n`;

  return explanation;
}

function generateRiskExplanation(riskFactors: string[]): string {
  let explanation = `**FACTORES DE RIESGO Y ADVERTENCIAS**\n\n`;

  if (riskFactors.length === 0) {
    explanation += `No se identificaron factores de riesgo mayores en este análisis.\n`;
    return explanation;
  }

  riskFactors.forEach((risk, idx) => {
    explanation += `${idx + 1}. ⚠️ ${risk}\n`;
  });

  return explanation;
}

function generateExecutiveSummary(
  trend: string,
  patterns: any[],
  prediction: any,
  summary: any
): string {
  let text = `**RESUMEN EJECUTIVO**\n\n`;

  text += `🔹 **Tendencia**: ${trend.toUpperCase()}\n`;
  text += `🔹 **Sesgo**: ${summary.bias}\n`;
  text += `🔹 **Sentimiento**: ${summary.overallSentiment}\n`;
  text += `🔹 **Patrones**: ${patterns.length} identificados\n`;
  text += `🔹 **Predicción**: ${prediction.direction.toUpperCase()} con ${prediction.probability}% de confianza\n\n`;

  text += `**En síntesis**: El mercado muestra una tendencia **${trend}** con `;

  if (patterns.length > 2) {
    text += `múltiples patrones alcistas confirmativos y `;
  } else if (patterns.length > 0) {
    text += `algunos patrones significativos y `;
  }

  text += `indicadores que sugieren un movimiento ${prediction.direction}. `;
  text += `La predicción tiene una confianza de **${prediction.confidenceLevel}** basada en el análisis técnico completo.\n`;

  return text;
}

