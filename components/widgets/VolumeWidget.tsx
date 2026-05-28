'use client';

import { useRef, useEffect, useMemo } from 'react';
import { createChart, ColorType, HistogramData, CrosshairMode } from 'lightweight-charts';
import { useMarketData } from '@/app/hooks/useMarketData';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { WidgetProps } from '@/lib/widgetRegistry';

function fmtVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

export function VolumeWidget({ symbol, timeframe }: WidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useMarketData(symbol, timeframe);
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(() => ({
    background: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#94a3b8' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    border: isDark ? '#334155' : '#cbd5e1',
  }), [isDark]);

  const volumeData: HistogramData[] = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map(d => ({
        time: Math.floor(d.time / 1000) as any,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
      }))
      .filter(d => d.value > 0);
  }, [data]);

  const totalVol = useMemo(() => data.reduce((s, d) => s + (d.volume || 0), 0), [data]);

  useEffect(() => {
    if (!containerRef.current || volumeData.length === 0) return;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    if (w <= 0 || h <= 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', labelBackgroundColor: colors.border },
        horzLine: { color: '#64748b', labelBackgroundColor: colors.border },
      },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border, timeVisible: true, visible: true },
      width: w, height: h,
      handleScroll: false, handleScale: false,
    });

    const series = chart.addHistogramSeries({
      color: 'rgba(100,116,139,0.4)',
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
      lastValueVisible: false,
    });
    series.setData(volumeData);

    try { chart.timeScale().fitContent(); } catch {}

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [volumeData, colors]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-destructive text-xs">{error}</p>
      </div>
    );
  }

  if (volumeData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-xs">{t('volume.noData')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold text-foreground">{t('volume.title')}</span>
        <span className="text-xs font-mono text-muted-foreground">{t('volume.total')} {fmtVolume(totalVol)}</span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}

export default VolumeWidget;
