'use client';

import React, { useState, useCallback } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import { TrendingUp, AlertCircle, CheckCircle2, BarChart3, Zap } from 'lucide-react';

interface CandleAnalysisComponentProps {
  symbol: string;
  timeframe: TimeFrame;
  candles: CandleData[];
  onAnalysisComplete?: (analysis: any) => void;
}

interface AnalysisResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

export function CandleAnalysisComponent({
  symbol,
  timeframe,
  candles,
  onAnalysisComplete
}: CandleAnalysisComponentProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisDepth, setAnalysisDepth] = useState<'basic' | 'standard' | 'comprehensive'>('standard');
  const [tradingStyle, setTradingStyle] = useState<'scalping' | 'day_trading' | 'swing' | 'position'>('swing');

  const performAnalysis = useCallback(async () => {
    if (!candles || candles.length === 0) {
      setError('No hay datos de velas para analizar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          candles,
          analysisDepth,
          tradingStyle
        })
      });

      const result: AnalysisResult = await response.json();

      if (!response.ok) {
        setError(result.error || 'Error en el análisis');
        setAnalysis(null);
      } else {
        setAnalysis(result);
        onAnalysisComplete?.(result.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al conectar con la API: ${message}`);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, candles, analysisDepth, tradingStyle, onAnalysisComplete]);

  if (!candles || candles.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <span>Sin datos de velas disponibles</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Profundidad del Análisis</label>
            <select
              value={analysisDepth}
              onChange={(e) => setAnalysisDepth(e.target.value as any)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
              disabled={isLoading}
            >
              <option value="basic">Básico</option>
              <option value="standard">Estándar</option>
              <option value="comprehensive">Completo</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Estilo de Trading</label>
            <select
              value={tradingStyle}
              onChange={(e) => setTradingStyle(e.target.value as any)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
              disabled={isLoading}
            >
              <option value="scalping">Scalping</option>
              <option value="day_trading">Day Trading</option>
              <option value="swing">Swing</option>
              <option value="position">Posición</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={performAnalysis}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded px-4 py-2 font-medium transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="inline-block animate-spin">⟳</span>
                  Analizando...
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  <Zap className="w-4 h-4" />
                  Analizar Velas
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Error</h3>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {analysis?.success && analysis.data && (
        <AnalysisResults data={analysis.data} />
      )}
    </div>
  );
}

interface AnalysisResultsProps {
  data: any;
}

function AnalysisResults({ data }: AnalysisResultsProps) {
  return (
    <div className="space-y-4">
      {/* Resumen Ejecutivo */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Resumen Ejecutivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tendencia</p>
            <p className="font-semibold text-foreground capitalize">{data.summary?.trend || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sesgo</p>
            <p className="font-semibold text-foreground">{data.summary?.bias || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sentimiento</p>
            <p className="font-semibold text-foreground">{data.summary?.overallSentiment || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Análisis Corto */}
      {data.shortAnalysis && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-lg mb-2">Análisis Rápido</h3>
          <p className="text-sm text-foreground leading-relaxed">{data.shortAnalysis}</p>
        </div>
      )}

      {/* Predicción Principal */}
      {data.mainPrediction && (
        <PredictionCard
          title="Predicción Principal"
          prediction={data.mainPrediction}
          type="main"
        />
      )}

      {/* Predicciones Alternativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.alternativePrediction && (
          <PredictionCard
            title="Escenario Alternativo"
            prediction={data.alternativePrediction}
            type="alternative"
          />
        )}
        {data.inversePrediction && (
          <PredictionCard
            title="Escenario Inverso"
            prediction={data.inversePrediction}
            type="inverse"
          />
        )}
      </div>

      {/* Patrones Identificados */}
      {data.patterns && data.patterns.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-lg mb-3">Patrones Identificados</h3>
          <div className="space-y-2">
            {data.patterns.slice(0, 5).map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-background/50">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{pattern.name}</p>
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                  <p className="text-xs text-muted-foreground">Fiabilidad: {pattern.reliability}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores Técnicos */}
      {data.indicatorStatus && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-lg mb-3">Indicadores Técnicos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <IndicatorBox
              label="RSI"
              value={data.indicatorStatus.rsi?.value?.toFixed(2)}
              status={data.indicatorStatus.rsi?.status}
            />
            <IndicatorBox
              label="MACD"
              value={data.indicatorStatus.macd?.histogram?.toFixed(4)}
              status={data.indicatorStatus.macd?.status}
            />
            <IndicatorBox
              label="Stochastic K"
              value={data.indicatorStatus.stochastic?.k?.toFixed(2)}
              status={data.indicatorStatus.stochastic?.status}
            />
            <IndicatorBox
              label="ATR"
              value={data.indicadorStatus?.atr?.toFixed(4)}
              status="info"
            />
          </div>
        </div>
      )}

      {/* Niveles Clave */}
      {data.keyLevels && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-lg mb-3">Niveles Clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.keyLevels.supports && data.keyLevels.supports.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Soportes</p>
                <div className="space-y-1">
                  {data.keyLevels.supports.map((support: number, idx: number) => (
                    <p key={idx} className="text-sm text-foreground">
                      {support.toFixed(2)}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {data.keyLevels.resistances && data.keyLevels.resistances.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Resistencias</p>
                <div className="space-y-1">
                  {data.keyLevels.resistances.map((resistance: number, idx: number) => (
                    <p key={idx} className="text-sm text-foreground">
                      {resistance.toFixed(2)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Factores de Riesgo */}
      {data.riskFactors && data.riskFactors.length > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <h3 className="font-semibold text-lg mb-3">⚠️ Factores de Riesgo</h3>
          <ul className="space-y-2">
            {data.riskFactors.map((risk: string, idx: number) => (
              <li key={idx} className="text-sm text-foreground flex gap-2">
                <span className="text-amber-500">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Advertencias */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <h3 className="font-semibold text-lg mb-3">⚠️ Advertencias Importantes</h3>
          <ul className="space-y-2">
            {data.warnings.map((warning: string, idx: number) => (
              <li key={idx} className="text-sm text-foreground flex gap-2">
                <span className="text-amber-500">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface PredictionCardProps {
  title: string;
  prediction: any;
  type: 'main' | 'alternative' | 'inverse';
}

function PredictionCard({ title, prediction, type }: PredictionCardProps) {
  const bgColor =
    type === 'main'
      ? 'bg-primary/10 border-primary/50'
      : type === 'alternative'
      ? 'bg-blue-500/10 border-blue-500/50'
      : 'bg-red-500/10 border-red-500/50';

  return (
    <div className={`rounded-lg border ${bgColor} bg-card p-4`}>
      <h3 className="font-semibold text-lg mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Dirección</p>
          <p className="font-semibold capitalize">{prediction.direction || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Probabilidad</p>
          <p className="font-semibold">{prediction.probability || 0}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Confianza</p>
          <p className="font-semibold capitalize">{prediction.confidenceLevel || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">R/R</p>
          <p className="font-semibold">{prediction.riskReward?.toFixed(2) || 'N/A'}</p>
        </div>
      </div>

      {prediction.targetPrice && (
        <div className="mt-3 p-3 rounded bg-background/50">
          <p className="text-sm font-medium text-muted-foreground mb-1">Objetivos de Precio</p>
          <div className="flex gap-2">
            {Array.isArray(prediction.targetPrice) ? (
              prediction.targetPrice.map((target: number, idx: number) => (
                <span key={idx} className="text-sm text-foreground">
                  {target.toFixed(2)}
                  {idx < prediction.targetPrice.length - 1 ? ',' : ''}
                </span>
              ))
            ) : (
              <span className="text-sm text-foreground">{prediction.targetPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      )}

      {prediction.stopLoss && (
        <div className="mt-2 p-3 rounded bg-background/50">
          <p className="text-sm font-medium text-muted-foreground mb-1">Stop Loss</p>
          <p className="text-sm text-destructive font-semibold">{prediction.stopLoss.toFixed(2)}</p>
        </div>
      )}

      {prediction.timeHorizon && (
        <div className="mt-2 p-3 rounded bg-background/50">
          <p className="text-sm font-medium text-muted-foreground mb-1">Horizonte Temporal</p>
          <p className="text-sm text-foreground">{prediction.timeHorizon}</p>
        </div>
      )}
    </div>
  );
}

interface IndicatorBoxProps {
  label: string;
  value?: string;
  status?: string;
}

function IndicatorBox({ label, value, status }: IndicatorBoxProps) {
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
    <div className="rounded bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${statusColor}`}>{value || 'N/A'}</p>
      {status && <p className="text-xs text-muted-foreground capitalize mt-1">{status}</p>}
    </div>
  );
}

