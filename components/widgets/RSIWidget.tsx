'use client';

import { useRef, useEffect, useMemo } from 'react';
import { createChart, ColorType, LineData, LineStyle } from 'lightweight-charts';
import { useMarketData } from '@/app/hooks/useMarketData';
import { calculateRSI } from '@/lib/indicators';
import { useTheme } from 'next-themes';
import type { WidgetProps } from '@/lib/widgetRegistry';

export function RSIWidget({ symbol, timeframe }: WidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useMarketData(symbol, timeframe);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(() => ({
    background: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#94a3b8' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    border: isDark ? '#334155' : '#cbd5e1',
    rsiColor: '#8b5cf6',
  }), [isDark]);

  const rsiData: LineData[] = useMemo(() => {
    if (!data || data.length < 15) return [];
    const closes = data.map(d => d.close);
    const rsiVals = calculateRSI(closes, 14);
    return data
      .map((d, i) => ({ time: Math.floor(d.time / 1000) as any, value: rsiVals[i] }))
      .filter(d => !isNaN(d.value) && isFinite(d.value));
  }, [data]);

  const currentRsi = useMemo(() => {
    if (rsiData.length === 0) return null;
    const last = rsiData[rsiData.length - 1].value;
    return last ?? null;
  }, [rsiData]);

  useEffect(() => {
    if (!containerRef.current || rsiData.length === 0) return;
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
      crosshair: { vertLine: { color: '#64748b', labelBackgroundColor: colors.border }, horzLine: { color: '#64748b', labelBackgroundColor: colors.border } },
      rightPriceScale: { borderColor: colors.border, autoScale: true, scaleMargins: { top: 0.15, bottom: 0.15 } },
      timeScale: { borderColor: colors.border, timeVisible: true, visible: true },
      width: w, height: h,
      handleScroll: false, handleScale: false,
    });

    const series = chart.addLineSeries({ color: colors.rsiColor, lineWidth: 2 });
    series.setData(rsiData);
    series.createPriceLine({ price: 70, color: '#ef5350', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
    series.createPriceLine({ price: 30, color: '#26a69a', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
    series.createPriceLine({ price: 50, color: '#64748b', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });

    try { chart.timeScale().fitContent(); } catch {}

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [rsiData, colors]);

  const rsiColor = currentRsi === null ? '#9ca3af'
    : currentRsi >= 70 ? '#ef5350'
    : currentRsi <= 30 ? '#26a69a'
    : '#8b5cf6';

  const rsiLabel = currentRsi === null ? ''
    : currentRsi >= 70 ? 'Sobrecompra'
    : currentRsi <= 30 ? 'Sobreventa'
    : 'Normal';

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

  if (rsiData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground text-xs">Sin datos suficientes para RSI</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold text-foreground">RSI(14)</span>
        <span className="font-mono font-bold text-xs" style={{ color: rsiColor }}>
          {currentRsi?.toFixed(2)} · {rsiLabel}
        </span>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}

export default RSIWidget;
