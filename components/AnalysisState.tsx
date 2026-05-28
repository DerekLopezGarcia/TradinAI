'use client';

import React from 'react';
import { AlertCircle, Loader2, Zap, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AnalysisLoadingProps {
  message?: string;
}

export function AnalysisLoading({ message }: AnalysisLoadingProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <BarChart3 className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground">{message || t('analysis.loadingDefault')}</p>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <div className="h-20 bg-background rounded-lg animate-pulse w-full max-w-md" />
      </div>
    </div>
  );
}

interface AnalysisErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AnalysisError({ message, onRetry }: AnalysisErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-destructive mb-1">{t('analysis.errorTitle')}</h3>
          <p className="text-sm text-destructive/80 max-w-md">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          >
            <Loader2 className="w-4 h-4" />
            {t('common.retry')}
          </button>
        )}
      </div>
    </div>
  );
}

interface AnalysisEmptyProps {
  symbol: string;
  onRunAnalysis: () => void;
  isLoading?: boolean;
}

export function AnalysisEmpty({ symbol, onRunAnalysis, isLoading }: AnalysisEmptyProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/5">
          <BarChart3 className="w-10 h-10 text-primary/60" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{t('analysis.emptyTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t('analysis.emptyDescription', { symbol })}
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-primary/20"
        >
          <Zap className="w-4 h-4" />
          {isLoading ? t('analysis.analyzing') : t('analysis.run')}
        </button>
      </div>
    </div>
  );
}

interface SentimentBadgeProps {
  type: 'bullish' | 'bearish' | 'neutral' | 'alcista' | 'bajista' | 'lateral';
  size?: 'sm' | 'md' | 'lg';
}

export function SentimentBadge({ type, size = 'md' }: SentimentBadgeProps) {
  const { t } = useTranslation();
  const isBullish = type === 'bullish' || type === 'alcista';
  const isBearish = type === 'bearish' || type === 'bajista';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  };

  const config = isBullish
    ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp, label: t('sentiment.bullish') }
    : isBearish
    ? { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', icon: TrendingDown, label: t('sentiment.bearish') }
    : { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-600 dark:text-slate-400', icon: Minus, label: t('sentiment.neutral') };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.border} border ${config.text}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
}

interface ConfidenceGaugeProps {
  value: number;
  size?: 'sm' | 'md';
}

export function ConfidenceGauge({ value, size = 'md' }: ConfidenceGaugeProps) {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 70 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = clamped >= 70 ? 'text-emerald-600 dark:text-emerald-400' : clamped >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('analysis.confidence')}</span>
        <span className={`text-sm font-bold ${textColor}`}>{Math.round(clamped)}%</span>
      </div>
      <div className={`w-full bg-muted rounded-full overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`${color} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

export function StatCard({ label, value, icon, color = 'default' }: StatCardProps) {
  const colorMap = {
    default: 'bg-background border-border text-foreground',
    success: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    danger: 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400',
    warning: 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
    info: 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-lg font-bold">{value}</span>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = '' }: SectionCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          {icon && <span className="text-foreground/70">{icon}</span>}
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
