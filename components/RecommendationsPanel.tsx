'use client';

import React, { useState, useMemo } from 'react';
import { useDailyRecommendations } from '@/app/hooks/useDailyRecommendations';
import { ScanResult } from '@/lib/services/assetScannerService';
import { useMarketStore } from '@/lib/store';
import {
  Zap,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  BarChart3,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
  Download,
  Activity,
  GripVertical,
} from 'lucide-react';
import { AnalysisEmpty, AnalysisLoading, AnalysisError, ConfidenceGauge } from './AnalysisState';

type SortKey = 'score' | 'roi' | 'confidence' | 'riskReward';
type FilterKey = 'all' | 'lowRisk' | 'highRoi' | 'highConfidence';

interface FilterOption {
  key: FilterKey;
  label: string;
  predicate: (a: ScanResult) => boolean;
}

const FILTERS: FilterOption[] = [
  { key: 'all', label: 'Todas', predicate: () => true },
  { key: 'lowRisk', label: 'Bajo Riesgo', predicate: (a) => a.riskLevel === 'low' },
  { key: 'highRoi', label: 'Alto ROI', predicate: (a) => a.roi >= 15 },
  { key: 'highConfidence', label: 'Alta Confianza', predicate: (a) => a.confidence >= 65 },
];

const SORT_LABELS: Record<SortKey, string> = {
  score: 'Puntuación',
  roi: 'ROI Esperado',
  confidence: 'Confianza',
  riskReward: 'Riesgo/Beneficio',
};

function formatScore(score: number): { label: string; color: string; bg: string } {
  if (score >= 75) return { label: 'Excelente', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
  if (score >= 55) return { label: 'Buena', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' };
  if (score >= 35) return { label: 'Regular', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
  return { label: 'Débil', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' };
}

function formatRisk(level: string): { label: string; border: string; text: string; bg: string } {
  switch (level) {
    case 'low': return { label: 'Bajo', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'medium': return { label: 'Medio', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
    default: return { label: 'Alto', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' };
  }
}

export function RecommendationsPanel() {
  const { recommendations, isLoading, error, fetchRecommendations, topRoi, byCategory, progress } = useDailyRecommendations();
  const favorites = useMarketStore((s) => s.favorites);
  const toggleFavorite = useMarketStore((s) => s.toggleFavorite);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showFilters, setShowFilters] = useState(true);

  const allAssets = useMemo(() => {
    const assets = topRoi.length > 0 ? topRoi : [];
    const filtered = assets.filter(FILTERS.find(f => f.key === activeFilter)!.predicate);
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'roi': return b.roi - a.roi;
        case 'confidence': return b.confidence - a.confidence;
        case 'riskReward': return b.riskReward - a.riskReward;
        default: return b.score - a.score;
      }
    });
    return sorted;
  }, [topRoi, activeFilter, sortBy]);

  const top10 = useMemo(() => allAssets.slice(0, 10), [allAssets]);

  const avgScore = useMemo(() => {
    if (top10.length === 0) return 0;
    return Math.round(top10.reduce((s, a) => s + a.score, 0) / top10.length);
  }, [top10]);

  const highConfidenceCount = useMemo(() => top10.filter(a => a.confidence >= 65).length, [top10]);
  const lowRiskCount = useMemo(() => top10.filter(a => a.riskLevel === 'low').length, [top10]);

  const renderAssetCard = (asset: ScanResult) => {
    const isFav = favorites.includes(asset.symbol);
    const scoreInfo = formatScore(asset.score);
    const riskInfo = formatRisk(asset.riskLevel);
    const isTrendBullish = asset.trend === 'alcista';
    const targetsWithDist = asset.prediction.targetPrice.slice(0, 3).map(t => ({
      price: t,
      pct: ((t - asset.currentPrice) / asset.currentPrice) * 100,
    }));

    return (
      <div
        key={asset.symbol}
        className="rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden group"
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${scoreInfo.bg} ${scoreInfo.color}`}>
              {asset.score}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-foreground truncate">{asset.symbol}</h4>
              <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider">{asset.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              asset.prediction.direction === 'bullish'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
            }`}>
              {asset.prediction.direction === 'bullish' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {asset.prediction.direction === 'bullish' ? 'ALCISTA' : 'BAJISTA'}
            </span>
            <button
              onClick={() => toggleFavorite(asset.symbol)}
              className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              {isFav ? (
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              ) : (
                <StarOff className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-4 pb-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Precio</span>
            <span className="text-xs font-bold font-mono text-foreground">
              ${asset.currentPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Confianza</span>
            <span className="text-xs font-bold font-mono text-foreground">
              {asset.confidence}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">ROI Esp.</span>
            <span className={`text-xs font-bold font-mono ${
              asset.roi >= 15 ? 'text-emerald-600 dark:text-emerald-400' : asset.roi >= 8 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
            }`}>
              +{asset.roi.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Riesgo</span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${riskInfo.bg} ${riskInfo.text}`}>
              {riskInfo.label}
            </span>
          </div>
        </div>

        {/* Trend + R/R bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>Tendencia: </span>
            <span className={isTrendBullish ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
              {asset.trend.charAt(0).toUpperCase() + asset.trend.slice(1)}
            </span>
            <span className="text-muted-foreground/50">|</span>
            <Shield className="w-3 h-3" />
            <span>R/R: </span>
            <span className={`font-semibold ${
              asset.riskReward >= 2 ? 'text-emerald-600 dark:text-emerald-400' : asset.riskReward >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {asset.riskReward.toFixed(2)}:1
            </span>
          </div>
        </div>

        {/* Targets */}
        <div className="px-4 pb-3 pt-1">
          <p className="text-[11px] text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
            <Target className="w-3 h-3" />
            Objetivos
          </p>
          <div className="flex gap-1.5">
            {targetsWithDist.map((t, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-lg bg-muted/30 border border-border px-2 py-1.5 text-center"
              >
                <p className="text-[10px] text-muted-foreground">TP{idx + 1}</p>
                <p className="text-xs font-bold font-mono text-foreground">
                  ${t.price.toFixed(2)}
                </p>
                <p className={`text-[10px] font-medium ${
                  t.pct > 0 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {t.pct > 0 ? '+' : ''}{t.pct.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (error && !recommendations) {
    return <AnalysisError message={error} onRetry={() => fetchRecommendations(true)} />;
  }

  if (!recommendations && isLoading) {
    return <AnalysisLoading message="Escaneando todos los activos del mercado..." />;
  }

  if (!recommendations) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recomendaciones de Hoy</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis de {Object.values(byCategory).reduce((s, a) => s + a.length, 0)} activos en 5 categorías
            </p>
          </div>
        </div>
        <AnalysisEmpty
          symbol="todos los activos"
          onRunAnalysis={() => fetchRecommendations()}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recomendaciones de Hoy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Basado en análisis técnico de {recommendations.totalScanned} activos · {(recommendations.scanDuration / 1000).toFixed(1)}s de escaneo
          </p>
        </div>
        <button
          onClick={() => fetchRecommendations(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Escaneando...' : 'Actualizar'}
        </button>
      </div>

      {/* Progress bar */}
      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Escaneando activos...
              </span>
              <span className="text-sm font-bold text-primary">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{progress.current} / {progress.total}</span>
              <span className="font-mono text-primary">{progress.currentSymbol || ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Market Overview Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DashboardCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Oportunidades"
          value={top10.length.toString()}
          sub={`Score promedio: ${avgScore}`}
          color={avgScore >= 60 ? 'success' : avgScore >= 40 ? 'warning' : 'danger'}
        />
        <DashboardCard
          icon={<Target className="w-4 h-4" />}
          label="Alta Confianza"
          value={highConfidenceCount.toString()}
          sub={`≥ 65% de ${top10.length}`}
          color="info"
        />
        <DashboardCard
          icon={<Shield className="w-4 h-4" />}
          label="Bajo Riesgo"
          value={lowRiskCount.toString()}
          sub={`de ${top10.length} oportunidades`}
          color="success"
        />
        <DashboardCard
          icon={<Activity className="w-4 h-4" />}
          label="Categoría Líder"
          value={Object.entries(byCategory).sort(([, a], [, b]) => b.length - a.length)[0]?.[0] || '—'}
          sub={`${Object.entries(byCategory).sort(([, a], [, b]) => b.length - a.length)[0]?.[1]?.length || 0} activos`}
          color="default"
        />
      </div>

      {/* Filters & Sort */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros y Orden</span>
          </div>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showFilters && (
          <div className="px-5 pb-4 border-t border-border space-y-3">
            <div className="pt-3">
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeFilter === f.key
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Ordenar por:</span>
              <div className="flex gap-1.5">
                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      sortBy === key
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {allAssets.length} activo{allAssets.length !== 1 ? 's' : ''} encontrado{allAssets.length !== 1 ? 's' : ''}
              {' '}(mostrando top 10)
            </p>
          </div>
        )}
      </div>

      {/* Top 10 Grid */}
      {top10.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Mejores Oportunidades
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {top10.map(renderAssetCard)}
          </div>
        </div>
      )}

      {/* By Category */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground">Por Categoría</h3>
        {Object.entries(byCategory).map(([category, assets]) => {
          const sorted = [...assets].sort((a, b) => b.score - a.score);
          return (
            <div key={category} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground capitalize">{category}</span>
                  <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {sorted.length} activo{sorted.length !== 1 ? 's' : ''}
                  </span>
                  {sorted.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Mejor score: {sorted[0].score}
                    </span>
                  )}
                </div>
                {expandedCategory === category ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {expandedCategory === category && (
                <div className="border-t border-border px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/10">
                  {sorted.map(renderAssetCard)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

function DashboardCard({ icon, label, value, sub, color }: DashboardCardProps) {
  const colorMap = {
    default: 'border-border bg-card',
    success: 'border-emerald-500/20 bg-emerald-500/5',
    danger: 'border-red-500/20 bg-red-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
  };

  const valueColorMap = {
    default: 'text-foreground',
    success: 'text-emerald-600 dark:text-emerald-400',
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColorMap[color]}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
