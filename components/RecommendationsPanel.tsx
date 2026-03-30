'use client';

import React, { useState } from 'react';
import { useDailyRecommendations } from '@/app/hooks/useDailyRecommendations';
import { ScanResult } from '@/lib/services/assetScannerService';
import {
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type TimeframeType = '1h' | '4h' | '1d' | '1w' | '1m';

interface TimeframeConfig {
  label: string;
  multiplier: number; // Multiplicador al ROI base
  description: string;
}

const TIMEFRAME_CONFIGS: Record<TimeframeType, TimeframeConfig> = {
  '1h': { label: '1 Hora', multiplier: 0.5, description: 'Inversión a corto plazo' },
  '4h': { label: '4 Horas', multiplier: 0.8, description: 'Corto plazo' },
  '1d': { label: '1 Día', multiplier: 1, description: 'ROI Base (1 Día)' },
  '1w': { label: '1 Semana', multiplier: 1.5, description: 'Mediano plazo' },
  '1m': { label: '1 Mes', multiplier: 2.5, description: 'Largo plazo' },
};

export function RecommendationsPanel() {
  const { recommendations, isLoading, error, fetchRecommendations, topRoi, byCategory, progress } = useDailyRecommendations();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('1d');
  const [minROI, setMinROI] = useState<number>(10);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Ajustar ROI según el timeframe seleccionado
  const adjustROI = (roi: number) => {
    const multiplier = TIMEFRAME_CONFIGS[selectedTimeframe].multiplier;
    return roi * multiplier;
  };

  const renderAssetCard = (asset: ScanResult) => {
    const adjustedROI = adjustROI(asset.roi);
    const exceedsMinROI = adjustedROI >= minROI;
    
    return (
      <div
        key={asset.symbol}
        className={`rounded-lg border p-4 hover:border-primary/50 transition-colors ${
          exceedsMinROI
            ? 'bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/50 dark:from-green-900/20 dark:to-green-950/10 dark:border-green-700/50'
            : 'bg-background border-border dark:bg-background'
        }`}
      >
          <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-bold text-foreground">{asset.symbol}</h4>
            <p className="text-xs text-muted-foreground">{asset.category}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold ${
            asset.prediction.direction === 'bullish'
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            {asset.prediction.direction.toUpperCase()}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Precio Actual</span>
            <span className="font-mono font-bold text-foreground dark:text-foreground">
              ${asset.currentPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">ROI Esperado</span>
            <div className="text-right">
              <span className={`font-mono font-bold text-lg ${
                exceedsMinROI 
                  ? 'text-green-600 dark:text-green-400' 
                  : adjustedROI >= 15 
                  ? 'text-green-600 dark:text-green-400' 
                  : adjustedROI >= 10 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-foreground dark:text-foreground'
              }`}>
                +{adjustedROI.toFixed(2)}%
              </span>
              {selectedTimeframe !== '1d' && (
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  ({asset.roi.toFixed(2)}% base)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Confianza</span>
            <span className="font-mono font-bold text-foreground dark:text-foreground">
              {asset.confidence}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">Riesgo/Beneficio</span>
            <span className={`font-mono font-bold ${
              asset.riskReward > 2 ? 'text-green-600 dark:text-green-400' : asset.riskReward > 1 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {asset.riskReward.toFixed(2)}:1
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border dark:border-border">
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-2">Objetivos</p>
          <div className="flex gap-2">
            {asset.prediction.targetPrice.slice(0, 3).map((target, idx) => (
              <div key={idx} className="text-xs">
                <p className="text-muted-foreground dark:text-muted-foreground">TP{idx + 1}</p>
                <p className="font-mono font-bold text-foreground dark:text-foreground">
                  ${target.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-destructive/50 p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botones */}
      <div className="bg-card rounded-lg border border-border p-6 dark:bg-card dark:border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-foreground">Recomendaciones de Hoy</h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Activos con ROI ≥ 10% basados en análisis de la semana
            </p>
          </div>
          <div className="flex gap-2">
            {recommendations && (
              <button
                onClick={() => fetchRecommendations(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-yellow-700 dark:hover:bg-yellow-600"
                title="Escanea de nuevo aunque ya haya resultados"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Escaneando...' : 'Escanear de Nuevo'}
              </button>
            )}
            {!recommendations && (
              <button
                onClick={() => fetchRecommendations()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-primary dark:text-primary-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Escaneando...' : 'Obtener Recomendaciones'}
              </button>
            )}
          </div>
        </div>

        {/* Información del escaneo */}
        {recommendations && (
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Total Escaneados</p>
              <p className="text-lg font-bold text-foreground dark:text-foreground">
                {recommendations.totalScanned}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Recomendaciones</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {recommendations.topRoi.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">Tiempo de Escaneo</p>
              <p className="text-lg font-bold text-foreground dark:text-foreground">
                {(recommendations.scanDuration / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Progreso - Mostrar durante el escaneo */}
      {isLoading && (
        <div className="bg-card rounded-lg border border-border p-6 dark:bg-card dark:border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                Escaneando activos...
              </h3>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                {progress.percentage}%
              </span>
            </div>

            {/* Barra de progreso visual */}
            <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden border border-border dark:bg-muted/30 dark:border-border">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {/* Información actual */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Progreso</p>
                <p className="text-sm font-bold text-foreground dark:text-foreground">
                  {progress.current} / {progress.total}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Activo Actual</p>
                <p className="text-sm font-mono font-bold text-primary dark:text-primary">
                  {(progress as any).currentSymbol || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">Estado</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Analizando...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resto del contenido */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4 dark:bg-card dark:border-border">
        <div>
          <p className="text-sm font-semibold text-foreground dark:text-foreground mb-3">Selecciona tu horizonte de inversión:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TIMEFRAME_CONFIGS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedTimeframe(key as TimeframeType)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedTimeframe === key
                    ? 'bg-primary text-primary-foreground dark:bg-primary dark:text-primary-foreground'
                    : 'bg-muted/50 text-foreground hover:bg-muted/70 dark:bg-muted/50 dark:text-foreground dark:hover:bg-muted/70'
                }`}
                title={config.description}
              >
                {config.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
            {TIMEFRAME_CONFIGS[selectedTimeframe].description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            ROI Mínimo: <span className="text-primary">{minROI}%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={minROI}
            onChange={(e) => setMinROI(parseFloat(e.target.value) || 0)}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            placeholder="Ingresa el ROI mínimo deseado"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Siempre mostraremos los 10 mejores. Los que superen {minROI}% estarán resaltados en verde
          </p>
        </div>
      </div>

      {!recommendations ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center dark:bg-card dark:border-border">
          <Zap className="w-12 h-12 text-primary dark:text-primary mx-auto mb-4" />
          <p className="text-muted-foreground dark:text-muted-foreground mb-4">
            Presiona el botón para escanear todos los activos y obtener recomendaciones
          </p>
          <button
            onClick={() => fetchRecommendations(true, selectedTimeframe, minROI)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium dark:bg-primary dark:text-primary-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Escaneando...' : 'Comenzar Escaneo'}
          </button>
        </div>
      ) : (
        <>
          {/* Top 10 Global - Siempre mostrado */}
          {topRoi.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Top 10 ROI
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Mostrando los 10 mejores - <span className="inline-block px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium">Los resaltados superan {minROI}%</span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topRoi.slice(0, 10).map(renderAssetCard)}
              </div>
            </div>
          )}

          {/* Por Categoría */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground dark:text-foreground">Por Categoría</h3>
            {Object.entries(byCategory).map(([category, assets]) => (
              <div key={category} className="border border-border rounded-lg overflow-hidden dark:border-border">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full bg-card hover:bg-muted/50 px-6 py-4 flex items-center justify-between transition-colors dark:bg-card dark:hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground dark:text-foreground">{category}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded dark:bg-primary/20 dark:text-primary">
                      {assets.length} recomendacion{assets.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  {expandedCategory === category ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                  )}
                </button>

                {expandedCategory === category && (
                  <div className="bg-background/50 border-t border-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 dark:bg-background/50 dark:border-border">
                    {assets.map(renderAssetCard)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isLoading && (
        <div className="bg-card rounded-lg border border-border p-8 text-center dark:bg-card dark:border-border">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 dark:border-primary dark:border-t-transparent" />
            <p className="text-muted-foreground dark:text-muted-foreground">
              Escaneando activos... Esto puede tomar unos minutos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

