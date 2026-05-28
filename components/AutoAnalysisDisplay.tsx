'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CandleData, TimeFrame } from '@/lib/types';
import { useAutoAnalysis } from '@/app/hooks/useAutoAnalysis';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CandlePattern, Prediction } from '@/lib/services/candleAnalysisService';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Shield,
  AlertTriangle,
  Newspaper,
  CandlestickChart,
  BarChart3,
  Activity,
  GripVertical,
} from 'lucide-react';
import {
  AnalysisLoading,
  AnalysisError,
  AnalysisEmpty,
  SentimentBadge,
  ConfidenceGauge,
  StatCard,
  SectionCard,
} from './AnalysisState';

const directionLabels: Record<string, string> = {
  bullish: 'sentiment.bullish',
  bajista: 'sentiment.bearish',
  lateral: 'sentiment.neutral',
};

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
  includeNews = true,
}: AutoAnalysisDisplayProps) {
  const { t } = useTranslation();
  const { analysis, explanation, isLoading, error, newsImpact, runAnalysis } = useAutoAnalysis(
    symbol,
    timeframe,
    candleData,
    'comprehensive',
    includeNews,
    true
  );

  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    trend: true,
    patterns: true,
    indicators: true,
    prediction: true,
    risk: false,
    news: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRunAnalysis = async () => {
    await runAnalysis(symbol, timeframe, candleData, 'comprehensive', includeNews);
  };

  if (error) {
    return <AnalysisError message={error} onRetry={handleRunAnalysis} />;
  }

  if (isLoading) {
    return <AnalysisLoading message={t('analysis.loading', { symbol, timeframe })} />;
  }

  if (!analysis) {
    return <AnalysisEmpty symbol={symbol} onRunAnalysis={handleRunAnalysis} />;
  }

  const trend = analysis.summary.trend;
  const isUptrend = trend === 'alcista';
  const prediction = analysis.mainPrediction;
  const isPredictionUp = prediction.direction === 'bullish';

  return (
    <div className="space-y-3">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {t('analysis.technical')}
          </span>
          <SentimentBadge
            type={trend}
            size="sm"
          />
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          {isLoading ? t('analysis.analyzing') : t('analysis.update')}
        </button>
      </div>

      {/* Summary Dashboard */}
      <SectionCard
        title={t('analysis.quickSummary')}
        icon={<BarChart3 className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label={t('analysis.trend')}
            value={trend.charAt(0).toUpperCase() + trend.slice(1)}
            icon={isUptrend ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            color={isUptrend ? 'success' : 'danger'}
          />
          <StatCard
            label={t('analysis.sentiment')}
            value={t(analysis.summary.overallSentiment)}
            color={isUptrend ? 'success' : 'danger'}
          />
          <div className="rounded-lg border border-border bg-background p-3">
            <ConfidenceGauge value={prediction.probability} size="sm" />
          </div>
          <StatCard
            label={t('analysis.riskReward')}
            value={`1:${prediction.riskReward.toFixed(2)}`}
            icon={<Target className="w-4 h-4" />}
            color={prediction.riskReward >= 2 ? 'success' : prediction.riskReward >= 1 ? 'warning' : 'danger'}
          />
        </div>
      </SectionCard>

      {/* Executive Summary */}
      <CollapsibleSection
        title={t('analysis.executiveSummary')}
        icon={<BarChart3 className="w-4 h-4" />}
        isOpen={expandedSections.summary}
        onToggle={() => toggleSection('summary')}
        badge={t('analysis.confidenceLabel', { value: prediction.probability })}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{explanation.summary}</ReactMarkdown>
        </div>
      </CollapsibleSection>

      {/* Trend Analysis */}
      <CollapsibleSection
        title={t('analysis.trendAnalysis')}
        icon={<Activity className="w-4 h-4" />}
        isOpen={expandedSections.trend}
        onToggle={() => toggleSection('trend')}
      >
        <div className="space-y-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation.tendencyReason}</ReactMarkdown>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={t('analysis.strength')} value={`${analysis.trendAnalysis.strength}/100`} color={analysis.trendAnalysis.strength > 70 ? 'success' : analysis.trendAnalysis.strength > 40 ? 'warning' : 'default'} />
            <StatCard label={t('analysis.adx')} value={analysis.trendAnalysis.adx.toFixed(1)} color={analysis.trendAnalysis.adx > 25 ? 'info' : 'default'} />
            <StatCard label={t('analysis.sma20')} value={analysis.trendAnalysis.sma[1]?.price.toFixed(2) || t('analysis.noDataValue')} />
            <StatCard label={t('analysis.ema12')} value={analysis.trendAnalysis.ema[0]?.price.toFixed(2) || t('analysis.noDataValue')} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Candle Patterns */}
      <CollapsibleSection
        title={t('analysis.candlePatterns')}
        icon={<CandlestickChart className="w-4 h-4" />}
        isOpen={expandedSections.patterns}
        onToggle={() => toggleSection('patterns')}
        badge={t('analysis.found', { count: analysis.patterns.length })}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {analysis.patterns.slice(0, 6).map((pattern: CandlePattern, idx: number) => {
              const isBullish = pattern.type?.includes('bullish');
              const isBearish = pattern.type?.includes('bearish');
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isBullish
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : isBearish
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                      : 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBullish ? <TrendingUp className="w-3 h-3" /> : isBearish ? <TrendingDown className="w-3 h-3" /> : null}
                  {pattern.name}
                  <span className="opacity-60">({pattern.reliability}%)</span>
                </span>
              );
            })}
            {analysis.patterns.length > 6 && (
              <span className="text-xs text-muted-foreground self-center">
                {t('analysis.more', { count: analysis.patterns.length - 6 })}
              </span>
            )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation.patternsReason}</ReactMarkdown>
          </div>
        </div>
      </CollapsibleSection>

      {/* Technical Indicators */}
      <CollapsibleSection
        title={t('analysis.technicalIndicators')}
        icon={<BarChart3 className="w-4 h-4" />}
        isOpen={expandedSections.indicators}
        onToggle={() => toggleSection('indicators')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <IndicatorCard
              name="RSI (14)"
              value={analysis.indicatorStatus.rsi.value?.toFixed(1)}
              status={analysis.indicatorStatus.rsi.status}
              type="rsi"
            />
            <IndicatorCard
              name="MACD"
              value={analysis.indicatorStatus.macd.histogram?.toFixed(2)}
              status={analysis.indicatorStatus.macd.status}
              type="macd"
            />
            <IndicatorCard
               name={t('indicator.stochK')}
              value={analysis.indicatorStatus.stochastic.k?.toFixed(1)}
              status={analysis.indicatorStatus.stochastic.status}
              type="stochastic"
            />
            <IndicatorCard
               name={`${t('indicator.bb')} Pos.`}
              value={analysis.indicatorStatus.bollingerBands.position?.replace('_', ' ')}
              type="bb"
            />
            <IndicatorCard
              name="ATR"
              value={analysis.indicatorStatus.atr?.toFixed(2)}
              type="atr"
            />
            <IndicatorCard
               name={t('common.volume')}
              value={analysis.indicatorStatus.volume.status}
              type="volume"
            />
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation.indicatorsReason}</ReactMarkdown>
          </div>
        </div>
      </CollapsibleSection>

      {/* Detailed Prediction */}
      <CollapsibleSection
        title={t('analysis.detailedPrediction')}
        icon={<Target className="w-4 h-4" />}
        isOpen={expandedSections.prediction}
        onToggle={() => toggleSection('prediction')}
      >
        <div className="space-y-4">
          {/* Price Targets and Stop Loss */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                {t('analysis.targets')}
              </p>
              <div className="space-y-1">
                {prediction.targetPrice.map((target: number, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-foreground">{target.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                {t('analysis.stopLoss')}
              </p>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">
                  S
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {prediction.stopLoss.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                {t('analysis.riskRewardRatio')}
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                1:{prediction.riskReward.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{prediction.timeHorizon}</p>
            </div>
          </div>

          {/* Alternative Scenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ScenarioCard
              title={t('analysis.alternativeScenario')}
              prediction={analysis.alternativePrediction}
              type={analysis.alternativePrediction?.direction === 'bullish' ? 'bullish' : 'bearish'}
            />
            <ScenarioCard
              title={t('analysis.inverseScenario')}
              prediction={analysis.inversePrediction}
              type="warning"
            />
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation.predictionsReason}</ReactMarkdown>
          </div>
        </div>
      </CollapsibleSection>

      {/* Risk Factors */}
      <CollapsibleSection
        title={t('analysis.riskFactors')}
        icon={<AlertTriangle className="w-4 h-4" />}
        isOpen={expandedSections.risk}
        onToggle={() => toggleSection('risk')}
        badge={t('analysis.risks', { count: analysis.riskFactors?.length || 0 })}
      >
        <div className="space-y-2">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation.riskReason}</ReactMarkdown>
          </div>
          {analysis.warnings && analysis.warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('analysis.warnings')}
              </p>
              <ul className="space-y-1">
                {analysis.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-xs text-amber-600/80 dark:text-amber-400/80 flex items-start gap-1.5">
                    <span className="mt-0.5">•</span>
                    {t(warning)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* News Impact */}
      {analysis.newsImpact && (
        <CollapsibleSection
          title={t('analysis.newsImpact')}
          icon={<Newspaper className="w-4 h-4" />}
          isOpen={expandedSections.news}
          onToggle={() => toggleSection('news')}
          badge={t('analysis.articles', { count: analysis.newsImpact.articleCount })}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label={t('analysis.direction')}
                value={
                  analysis.newsImpact.dominantDirection === 'bullish' ? t('analysis.bullish') :
                  analysis.newsImpact.dominantDirection === 'bearish' ? t('analysis.bearish') : t('analysis.neutralDir')
                }
                color={
                  analysis.newsImpact.dominantDirection === 'bullish' ? 'success' :
                  analysis.newsImpact.dominantDirection === 'bearish' ? 'danger' : 'default'
                }
              />
              <StatCard label={t('analysis.confidence')} value={`${analysis.newsImpact.confidence}%`} color="info" />
              <StatCard
                label={t('analysis.impact')}
                value={
                  analysis.newsImpact.impactLevel === 'high' ? t('analysis.impactHigh') :
                  analysis.newsImpact.impactLevel === 'moderate' ? t('analysis.impactModerate') : t('analysis.impactLow')
                }
                color={
                  analysis.newsImpact.impactLevel === 'high' ? 'warning' :
                  analysis.newsImpact.impactLevel === 'moderate' ? 'info' : 'default'
                }
              />
              <StatCard label={t('analysis.articlesCount')} value={analysis.newsImpact.articleCount} />
            </div>

            {/* Sentiment bar */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{t('analysis.overallSentiment')}</p>
              <div className="relative h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-500"
                  style={{
                    left: `${((analysis.newsImpact.overallSentimentScore + 1) / 2) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>{t('analysis.negative')}</span>
                <span>{t('analysis.neutralDir')}</span>
                <span>{t('analysis.positive')}</span>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{explanation.newsReason}</ReactMarkdown>
            </div>

            {includeNews && analysis.newsImpact.articleCount === 0 && (
              <p className="text-xs text-muted-foreground italic">
                {t('analysis.noNews')}
              </p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Detailed Analysis */}
      <SectionCard title={t('analysis.fullAnalysis')} icon={<BarChart3 className="w-4 h-4" />}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{analysis.detailedAnalysis}</ReactMarkdown>
        </div>
      </SectionCard>
    </div>
  );
}

// ==================== Subcomponents ====================

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}

function CollapsibleSection({ title, icon, isOpen, onToggle, children, badge }: CollapsibleSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="border-t border-border px-4 py-3">{children}</div>}
    </div>
  );
}

interface IndicatorCardProps {
  name: string;
  value?: string | number | null;
  status?: string;
  type?: string;
}

function IndicatorCard({ name, value, status, type }: IndicatorCardProps) {
  const getStatusConfig = () => {
    if (!status) return { color: 'text-foreground', bg: 'bg-background', border: 'border-border' };

    if (status === 'overbought' || status === 'bearish')
      return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20' };
    if (status === 'oversold' || status === 'bullish')
      return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' };
    return { color: 'text-foreground', bg: 'bg-background', border: 'border-border' };
  };

  const cfg = getStatusConfig();

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
      <p className="text-xs text-muted-foreground font-medium">{name}</p>
      <p className={`text-sm font-bold mt-0.5 ${cfg.color}`}>
        {value != null ? value : '—'}
      </p>
      {status && (
        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{status}</p>
      )}
    </div>
  );
}

interface ScenarioCardProps {
  title: string;
  prediction?: Prediction;
  type: 'bullish' | 'bearish' | 'warning';
}

function ScenarioCard({ title, prediction, type }: ScenarioCardProps) {
  const { t } = useTranslation();
  if (!prediction) return null;

  const configs = {
    bullish: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-600 dark:text-emerald-400' },
    bearish: { border: 'border-red-500/20', bg: 'bg-red-500/5', text: 'text-red-600 dark:text-red-400' },
    warning: { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-600 dark:text-amber-400' },
  };

  const cfg = configs[type];

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
      <div className="flex items-center gap-2 mb-1">
        {type === 'bullish' ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : type === 'bearish' ? (
          <TrendingDown className="w-4 h-4 text-red-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        )}
        <span className="font-semibold capitalize text-foreground">{t(directionLabels[prediction.direction] || 'sentiment.neutral')}</span>
        <span className={`text-xs font-medium ${cfg.text}`}>({prediction.probability}%)</span>
      </div>
      {prediction.targetPrice?.[0] != null && (
        <p className="text-xs text-muted-foreground">
          {t('analysis.objective')}: <span className="font-medium text-foreground">{prediction.targetPrice[0].toFixed(2)}</span>
        </p>
      )}
    </div>
  );
}
