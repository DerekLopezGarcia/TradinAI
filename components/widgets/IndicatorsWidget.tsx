'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useMarketData } from '@/app/hooks/useMarketData';
import { Tooltip, IndicatorLegend } from '@/components/IndicatorTooltip';
import { calculateRSI, calculateSMA, calculateEMA, calculateADX, calculateStochastic } from '@/lib/indicators';
import type { WidgetProps } from '@/lib/widgetRegistry';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function IndicatorsWidget({ symbol, timeframe }: WidgetProps) {
  const { t } = useTranslation();
  const { data, loading } = useMarketData(symbol, timeframe);
  const [showBollinger, setShowBollinger] = useState(false);

  const indicators = useMemo(() => {
    if (data.length === 0) {
      return { sma: null, ema: null, rsi: null, adx: null, stochasticK: null, stochasticD: null };
    }

    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const sma20 = calculateSMA(closes, 20);
    const lastSMA = sma20.length > 0 ? sma20[sma20.length - 1] : null;
    const rsi14 = calculateRSI(closes, 14);
    const lastRSI = rsi14.length > 0 ? rsi14[rsi14.length - 1] : null;
    const adx14 = calculateADX(highs, lows, closes, 14);
    const lastADX = adx14.length > 0 ? adx14[adx14.length - 1] : null;
    const stoch = calculateStochastic(highs, lows, closes, 14);
    const lastK = stoch.k.length > 0 ? stoch.k[stoch.k.length - 1] : null;
    const lastD = stoch.d.length > 0 ? stoch.d[stoch.d.length - 1] : null;

    const emaValues = calculateEMA(closes, 20);
    const lastEMA = emaValues.length > 0 ? emaValues[emaValues.length - 1] : null;

    return {
      sma: lastSMA && !isNaN(lastSMA) ? lastSMA : null,
      ema: lastEMA && !isNaN(lastEMA) ? lastEMA : null,
      rsi: lastRSI && !isNaN(lastRSI) ? lastRSI : null,
      adx: lastADX && !isNaN(lastADX) ? lastADX : null,
      stochasticK: lastK && !isNaN(lastK) ? lastK : null,
      stochasticD: lastD && !isNaN(lastD) ? lastD : null,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const indicatorItems = [
    { label: t('indicators.sma'), value: indicators.sma, tooltip: t('indicator.sma') + ' (20).' },
    { label: t('indicators.ema'), value: indicators.ema, tooltip: t('indicator.ema') + ' (20).' },
  ];

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        {indicatorItems.map(({ label, value, tooltip }) => (
          <div key={label} className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <Tooltip content={tooltip}>
              <span className="text-xs text-muted-foreground">{label}</span>
            </Tooltip>
            <span className="text-sm font-mono font-bold text-foreground">
              {value !== null ? value.toFixed(2) : '—'}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <Tooltip content={t('indicator.rsiTooltip')}>
            <span className="text-xs text-muted-foreground">RSI(14)</span>
          </Tooltip>
          <span
            className="text-sm font-mono font-bold"
            style={{
              color: indicators.rsi === null
                ? 'hsl(var(--muted-foreground))'
                : indicators.rsi >= 70 ? '#ef5350'
                : indicators.rsi <= 30 ? '#26a69a'
                : '#818cf8',
            }}
          >
            {indicators.rsi !== null ? indicators.rsi.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <Tooltip content={t('indicator.adxTooltip')}>
            <span className="text-xs text-muted-foreground">ADX(14)</span>
          </Tooltip>
          <span
            className="text-sm font-mono font-bold"
            style={{
              color: indicators.adx === null
                ? 'hsl(var(--muted-foreground))'
                : indicators.adx >= 40 ? '#ef5350'
                : indicators.adx >= 25 ? '#fbbf24'
                : indicators.adx >= 20 ? '#60a5fa'
                : 'hsl(var(--muted-foreground))',
            }}
          >
            {indicators.adx !== null ? indicators.adx.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <Tooltip content={t('indicator.stochKTooltip')}>
            <span className="text-xs text-muted-foreground">Stoch %K</span>
          </Tooltip>
          <span
            className="text-sm font-mono font-bold"
            style={{
              color: indicators.stochasticK === null
                ? 'hsl(var(--muted-foreground))'
                : indicators.stochasticK >= 80 ? '#ef5350'
                : indicators.stochasticK <= 20 ? '#26a69a'
                : '#818cf8',
            }}
          >
            {indicators.stochasticK !== null ? indicators.stochasticK.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <Tooltip content={t('indicator.stochDTooltip')}>
            <span className="text-xs text-muted-foreground">Stoch %D</span>
          </Tooltip>
          <span
            className="text-sm font-mono font-bold"
            style={{
              color: indicators.stochasticD === null
                ? 'hsl(var(--muted-foreground))'
                : indicators.stochasticD >= 80 ? '#ef5350'
                : indicators.stochasticD <= 30 ? '#26a69a'
                : '#818cf8',
            }}
          >
            {indicators.stochasticD !== null ? indicators.stochasticD.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
          <Tooltip content={t('indicator.bbTooltip')}>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`text-xs px-2 py-1 rounded transition-colors border ${
                showBollinger
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              {showBollinger ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
              Bollinger
            </button>
          </Tooltip>
          <span className="text-sm font-mono font-bold text-primary">
            {showBollinger ? '✓' : '◯'}
          </span>
        </div>
      </div>
      <IndicatorLegend isOpen={false} />
    </div>
  );
}
