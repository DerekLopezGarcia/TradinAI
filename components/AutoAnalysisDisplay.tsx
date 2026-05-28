'use client';

import React, { useState } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import { useAutoAnalysis } from '@/app/hooks/useAutoAnalysis';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

interface AutoAnalysisDisplayProps {
  symbol: string;
  timeframe: TimeFrame;
  candleData: CandleData[];
  includeNews?: boolean;
}

export function AutoAnalysisDisplay({
  symbol,
  timeframe,
  candleData,
  includeNews = false,
}: AutoAnalysisDisplayProps) {
  const { analysis, explanation, isLoading, error, newsImpact, runAnalysis } = useAutoAnalysis(
    symbol,
    timeframe,
    candleData,
    'comprehensive',
    includeNews
  );

  const [expandedSections, setExpandedSections] = useState({
    trend: true,
    patterns: true,
    indicators: true,
    prediction: true,
    risk: false,
    news: true,
    summary: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRunAnalysis = async () => {
    await runAnalysis(symbol, timeframe, candleData, 'comprehensive', includeNews);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Error en Análisis</h3>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-block animate-spin">⟳</span>
            <span className="text-muted-foreground">
              Analizando velas para {symbol} ({timeframe})...
            </span>
          </div>
          <div className="h-32 bg-background rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Haz clic en el botón para analizar automáticamente las velas y obtener recomendaciones
          </p>
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-4 h-4" />
            Ejecutar Análisis
          </button>
        </div>
      </div>
    );
  }

  const trend = analysis.summary.trend;
  const isUptrend = trend === 'alcista';
  const prediction = analysis.mainPrediction;
  const isPredictionUp = prediction.direction === 'bullish';

  return (
    <div className="space-y-4">
      {/* Botón para ejecutar/actualizar análisis */}
      <div className="flex justify-end">
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          <Zap className="w-4 h-4" />
          {isLoading ? 'Analizando...' : 'Ejecutar Análisis'}
        </button>
      </div>

      {/* Header - Resumen Rápido */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Tendencia</p>
            <div className="flex items-center gap-1 mt-2">
              {isUptrend ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <p className="font-bold text-lg capitalize">{trend}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase">Sentimiento</p>
            <p className="font-semibold text-sm mt-2">
              {analysis.summary.overallSentiment}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase">Predicción</p>
            <div className="flex items-center gap-1 mt-2">
              {isPredictionUp ? (
                <Zap className="w-4 h-4 text-green-500" />
              ) : (
                <Zap className="w-4 h-4 text-red-500" />
              )}
              <p className="font-semibold capitalize">{prediction.direction}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase">
              Confianza
            </p>
            <p className="font-bold text-lg mt-2">
              {prediction.probability}%
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase">R/R</p>
            <p className="font-semibold text-sm mt-2">
              1:{prediction.riskReward.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <CollapsibleSection
        title="📋 Resumen Ejecutivo"
        isOpen={expandedSections.summary}
        onToggle={() => toggleSection('summary')}
      >
        <div className="prose prose-sm max-w-none">
          <MarkdownContent content={explanation.summary} />
        </div>
      </CollapsibleSection>

      {/* Análisis de Tendencia */}
      <CollapsibleSection
        title="📈 Análisis de Tendencia"
        isOpen={expandedSections.trend}
        onToggle={() => toggleSection('trend')}
      >
        <div className="space-y-4">
          <MarkdownContent content={explanation.tendencyReason} />

          {/* Cuadro de detalles técnicos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <TechBox
              label="Fuerza"
              value={analysis.trendAnalysis.strength}
              unit="/100"
            />
            <TechBox label="ADX" value={analysis.trendAnalysis.adx.toFixed(2)} />
            <TechBox
              label="SMA 20"
              value={analysis.trendAnalysis.sma[1]?.price.toFixed(2) || 'N/A'}
            />
            <TechBox
              label="EMA 12"
              value={analysis.trendAnalysis.ema[0]?.price.toFixed(2) || 'N/A'}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Patrones de Velas */}
      <CollapsibleSection
        title={`🕯️ Patrones de Velas (${analysis.patterns.length})`}
        isOpen={expandedSections.patterns}
        onToggle={() => toggleSection('patterns')}
      >
        <div className="space-y-3">
          <MarkdownContent content={explanation.patternsReason} />
        </div>
      </CollapsibleSection>

      {/* Indicadores Técnicos */}
      <CollapsibleSection
        title="📊 Indicadores Técnicos"
        isOpen={expandedSections.indicators}
        onToggle={() => toggleSection('indicators')}
      >
        <div className="space-y-4">
          <MarkdownContent content={explanation.indicatorsReason} />

          {/* Visualización de indicadores */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <IndicatorBox
              name="RSI"
              value={analysis.indicatorStatus.rsi.value}
              status={analysis.indicatorStatus.rsi.status}
              range="0-100"
            />
            <IndicatorBox
              name="MACD"
              value={analysis.indicatorStatus.macd.histogram}
              status={analysis.indicatorStatus.macd.status}
            />
            <IndicatorBox
              name="Stochastic K"
              value={analysis.indicatorStatus.stochastic.k}
              status={analysis.indicatorStatus.stochastic.status}
              range="0-100"
            />
            <IndicatorBox
              name="BB Position"
              value={analysis.indicatorStatus.bollingerBands.position}
            />
            <IndicatorBox
              name="ATR"
              value={analysis.indicatorStatus.atr}
            />
            <IndicatorBox
              name="Volumen"
              value={analysis.indicatorStatus.volume.status}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Predicción Detallada */}
      <CollapsibleSection
        title="🎯 Predicción Detallada"
        isOpen={expandedSections.prediction}
        onToggle={() => toggleSection('prediction')}
      >
        <div className="space-y-4">
          <MarkdownContent content={explanation.predictionsReason} />

          {/* Objetivos y Stops */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
              <p className="text-xs text-muted-foreground uppercase mb-2">
                Objetivos de Precio
              </p>
              <div className="space-y-1">
                {prediction.targetPrice.map((target: number, idx: number) => (
                  <p key={idx} className="font-semibold text-lg">
                    {idx === 0 ? '🎯' : '🎯'} {target.toFixed(2)}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-xs text-muted-foreground uppercase mb-2">
                Stop Loss
              </p>
              <p className="font-semibold text-lg text-red-600">
                🛑 {prediction.stopLoss.toFixed(2)}
              </p>
            </div>

            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
              <p className="text-xs text-muted-foreground uppercase mb-2">
                Relación R/R
              </p>
              <p className="font-semibold text-lg">
                1:{prediction.riskReward.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {prediction.timeHorizon}
              </p>
            </div>
          </div>

          {/* Escenarios alternativos */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScenarioBox
              title="Escenario Alternativo"
              prediction={analysis.alternativePrediction}
              type="alternative"
            />
            <ScenarioBox
              title="Escenario Inverso"
              prediction={analysis.inversePrediction}
              type="inverse"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Factores de Riesgo */}
      <CollapsibleSection
        title="⚠️ Factores de Riesgo"
        isOpen={expandedSections.risk}
        onToggle={() => toggleSection('risk')}
      >
        <div className="space-y-2">
          <MarkdownContent content={explanation.riskReason} />
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                Advertencias Importantes:
              </p>
              <ul className="text-sm text-amber-600 space-y-1">
                {analysis.warnings.map((warning: string, idx: number) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Impacto de Noticias */}
      {analysis.newsImpact && (
        <CollapsibleSection
          title={`📰 Impacto de Noticias (${analysis.newsImpact.articleCount} artículos)`}
          isOpen={expandedSections.news}
          onToggle={() => toggleSection('news')}
        >
          <div className="space-y-4">
            <MarkdownContent content={explanation.newsReason} />

            {/* Score bar */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Sentimiento General</p>
              <div className="relative h-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-500"
                  style={{
                    left: `${((analysis.newsImpact.overallSentimentScore + 1) / 2) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Negativo -1</span>
                <span>Neutral 0</span>
                <span>Positivo +1</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="rounded bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Dirección</p>
                <p className={`text-sm font-semibold mt-1 ${
                  analysis.newsImpact.dominantDirection === 'bullish' ? 'text-green-500' :
                  analysis.newsImpact.dominantDirection === 'bearish' ? 'text-red-500' : 'text-foreground'
                }`}>
                  {analysis.newsImpact.dominantDirection === 'bullish' ? 'Alcista' :
                   analysis.newsImpact.dominantDirection === 'bearish' ? 'Bajista' : 'Neutral'}
                </p>
              </div>
              <div className="rounded bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Confianza</p>
                <p className="text-sm font-semibold mt-1">{analysis.newsImpact.confidence}%</p>
              </div>
              <div className="rounded bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Impacto</p>
                <p className={`text-sm font-semibold mt-1 ${
                  analysis.newsImpact.impactLevel === 'high' ? 'text-orange-500' :
                  analysis.newsImpact.impactLevel === 'moderate' ? 'text-yellow-500' : 'text-muted-foreground'
                }`}>
                  {analysis.newsImpact.impactLevel === 'high' ? 'Alto' :
                   analysis.newsImpact.impactLevel === 'moderate' ? 'Moderado' : 'Bajo'}
                </p>
              </div>
              <div className="rounded bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground font-medium">Artículos</p>
                <p className="text-sm font-semibold mt-1">{analysis.newsImpact.articleCount}</p>
              </div>
            </div>

            {includeNews && analysis.newsImpact.articleCount === 0 && (
              <p className="text-xs text-muted-foreground italic mt-2">
                No hay noticias recientes disponibles para este activo.
              </p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Análisis Detallado */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">
          Análisis Completo Detallado
        </p>
        <div className="prose prose-sm max-w-none">
          <MarkdownContent content={analysis.detailedAnalysis} />
        </div>
      </div>
    </div>
  );
}

// ==================== Componentes Auxiliares ====================

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-foreground">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

interface TechBoxProps {
  label: string;
  value: string | number;
  unit?: string;
}

function TechBox({ label, value, unit }: TechBoxProps) {
  return (
    <div className="rounded bg-background p-3">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-1">
        {value}
        {unit}
      </p>
    </div>
  );
}

interface IndicatorBoxProps {
  name: string;
  value?: string | number;
  status?: string;
  range?: string;
}

function IndicatorBox({ name, value, status, range }: IndicatorBoxProps) {
  const statusColor =
    status === 'overbought'
      ? 'text-red-500'
      : status === 'oversold'
      ? 'text-green-500'
      : status === 'bullish'
      ? 'text-green-500'
      : status === 'bearish'
      ? 'text-red-500'
      : 'text-foreground';

  return (
    <div className="rounded bg-background p-3 border border-border">
      <p className="text-xs text-muted-foreground font-medium">{name}</p>
      <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </p>
      {status && (
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {status}
        </p>
      )}
      {range && (
        <p className="text-xs text-muted-foreground">{range}</p>
      )}
    </div>
  );
}

interface ScenarioBoxProps {
  title: string;
  prediction: any;
  type: 'alternative' | 'inverse';
}

function ScenarioBox({ title, prediction, type }: ScenarioBoxProps) {
  const bgColor =
    type === 'alternative'
      ? 'bg-blue-500/10 border-blue-500/30'
      : 'bg-red-500/10 border-red-500/30';

  return (
    <div className={`rounded-lg border ${bgColor} p-3`}>
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {title}
      </p>
      <div className="space-y-1">
        <p className="text-sm">
          <span className="capitalize font-semibold">{prediction.direction}</span>
          {' '}({prediction.probability}%)
        </p>
        <p className="text-xs text-muted-foreground">
          Objetivo: {prediction.targetPrice[0]?.toFixed(2) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
  // Convertir markdown simple a componentes React
  return (
    <div className="space-y-2 text-sm text-foreground leading-relaxed">
      {content.split('\n').map((line, idx) => {
        if (line.startsWith('**')) {
          const text = line.replace(/\*\*/g, '');
          return (
            <p key={idx} className="font-semibold">
              {text}
            </p>
          );
        }
        if (line.startsWith('#')) {
          return <p key={idx} className="font-bold text-base">{line.replace(/#+\s/, '')}</p>;
        }
        if (line.trim() === '') {
          return <div key={idx} className="h-2" />;
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}

