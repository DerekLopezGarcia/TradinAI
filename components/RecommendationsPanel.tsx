'use client';

import React, { useState } from 'react';
import { useDailyRecommendations } from '@/app/hooks/useDailyRecommendations';
import { ScanResult } from '@/lib/services/assetScannerService';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function RecommendationsPanel() {
  const { recommendations, isLoading, error, fetchRecommendations, topRoi, byCategory } = useDailyRecommendations();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderAssetCard = (asset: ScanResult) => (
    <div
      key={asset.symbol}
      className="bg-background rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-foreground">{asset.symbol}</h4>
          <p className="text-xs text-muted-foreground">{asset.category}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${
          asset.prediction.direction === 'bullish'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {asset.prediction.direction.toUpperCase()}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Precio Actual</span>
          <span className="font-mono font-bold text-foreground">
            ${asset.currentPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">ROI Esperado</span>
          <span className={`font-mono font-bold text-lg ${
            asset.roi >= 15 ? 'text-green-400' : asset.roi >= 10 ? 'text-yellow-400' : 'text-white'
          }`}>
            +{asset.roi.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Confianza</span>
          <span className="font-mono font-bold text-foreground">
            {asset.confidence}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Riesgo/Beneficio</span>
          <span className={`font-mono font-bold ${
            asset.riskReward > 2 ? 'text-green-400' : asset.riskReward > 1 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {asset.riskReward.toFixed(2)}:1
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Objetivos</p>
        <div className="flex gap-2">
          {asset.prediction.targetPrice.slice(0, 3).map((target, idx) => (
            <div key={idx} className="text-xs">
              <p className="text-muted-foreground">TP{idx + 1}</p>
              <p className="font-mono font-bold text-foreground">
                ${target.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
      {/* Header con botón */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Recomendaciones de Hoy</h2>
            <p className="text-sm text-muted-foreground">
              Activos con ROI ≥ 10% basados en análisis de la semana
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Escaneando...' : 'Obtener Recomendaciones'}
          </button>
        </div>

        {/* Información del escaneo */}
        {recommendations && (
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Total Escaneados</p>
              <p className="text-lg font-bold text-foreground">
                {recommendations.totalScanned}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recomendaciones</p>
              <p className="text-lg font-bold text-green-400">
                {recommendations.topRoi.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tiempo de Escaneo</p>
              <p className="text-lg font-bold text-foreground">
                {(recommendations.scanDuration / 1000).toFixed(1)}s
              </p>
            </div>
          </div>
        )}
      </div>

      {!recommendations ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Presiona el botón para escanear todos los activos y obtener recomendaciones
          </p>
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Escaneando...' : 'Comenzar Escaneo'}
          </button>
        </div>
      ) : (
        <>
          {/* Top 10 Global */}
          {topRoi.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Top 10 ROI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topRoi.map(renderAssetCard)}
              </div>
            </div>
          )}

          {/* Por Categoría */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Por Categoría</h3>
            {Object.entries(byCategory).map(([category, assets]) => (
              <div key={category} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full bg-card hover:bg-muted/50 px-6 py-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{category}</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {assets.length} recomendación{assets.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  {expandedCategory === category ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedCategory === category && (
                  <div className="bg-background/50 border-t border-border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assets.map(renderAssetCard)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {isLoading && (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="inline-block">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">
              Escaneando activos... Esto puede tomar unos minutos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

