'use client';

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  createChart,
  ColorType,
  UTCTimestamp,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  HistogramData,
  LineData,
  CrosshairMode,
  LineStyle,
  IPriceLine,
} from 'lightweight-charts';
import { CandleData } from '@/lib/types';
import { calculateRSI } from '@/lib/indicators';

interface TradingViewChartProps {
  data: CandleData[];
  symbol: string;
  interval?: string;
  showVolume?: boolean;
  showRSI?: boolean;
  isFallback?: boolean;
}

export function TradingViewChart({
  data,
  symbol,
  interval = '1h',
  showVolume = true,
  showRSI = true,
  isFallback = false,
}: TradingViewChartProps) {
  // ── Refs chart principal ──────────────────────────────────────────
  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // ── Refs panel RSI ────────────────────────────────────────────────
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartRef     = useRef<IChartApi | null>(null);
  const rsiSeriesRef    = useRef<ISeriesApi<'Line'> | null>(null);
  // PriceLines para 70 / 50 / 30 — se dibujan en todo el ancho del chart siempre
  const pl70Ref = useRef<IPriceLine | null>(null);
  const pl50Ref = useRef<IPriceLine | null>(null);
  const pl30Ref = useRef<IPriceLine | null>(null);

  // Control de sincronización y estado anterior
  const syncingRef      = useRef<boolean>(false);
  const prevDataLenRef  = useRef<number>(0);
  const prevLastTimeRef = useRef<number>(0);
  const initialZoomDone = useRef<boolean>(false);

  const [chartReady, setChartReady] = useState(false);
  const [rsiReady,   setRsiReady]   = useState(false);
  const [rsiValue,   setRsiValue]   = useState<number | null>(null);
  const [isCalcRSI,  setIsCalcRSI]  = useState(false);

  // ── helpers ───────────────────────────────────────────────────────
  const toUTC = useCallback((ms: number): UTCTimestamp =>
    Math.floor(ms / 1000) as UTCTimestamp, []);

  const buildCandleData = useCallback(
    (raw: CandleData[]): CandlestickData[] =>
      raw
        .map(c => ({ time: toUTC(c.time), open: +c.open, high: +c.high, low: +c.low, close: +c.close }))
        .filter((c, i, a) => i === 0 || (c.time as number) > (a[i - 1].time as number))
        .sort((a, b) => (a.time as number) - (b.time as number)),
    [toUTC]
  );

  const buildVolumeData = useCallback(
    (raw: CandleData[]): HistogramData[] =>
      raw
        .map(c => ({
          time:  toUTC(c.time),
          value: +c.volume || 0,
          color: +c.close >= +c.open ? 'rgba(38,166,154,0.55)' : 'rgba(239,83,80,0.55)',
        }))
        .filter((c, i, a) => i === 0 || (c.time as number) > (a[i - 1].time as number))
        .sort((a, b) => (a.time as number) - (b.time as number)),
    [toUTC]
  );

  // ── Calcular RSI (Wilder, período 14) ────────────────────────────
  const rsiData: LineData[] = useMemo(() => {
    if (!data || data.length < 15) return [];
    const closes  = data.map(d => +d.close);
    const rsiVals = calculateRSI(closes, 14);
    return data
      .map((d, i) => ({ time: toUTC(d.time), value: rsiVals[i] }))
      .filter(d => !isNaN(d.value) && isFinite(d.value))
      .filter((d, i, a) => i === 0 || (d.time as number) > (a[i - 1].time as number))
      .sort((a, b) => (a.time as number) - (b.time as number)) as LineData[];
  }, [data, toUTC]);

  // ── Inicializar chart principal ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#9ca3af',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1f2937', style: LineStyle.Solid },
        horzLines: { color: '#1f2937', style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
        horzLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        textColor: '#9ca3af',
        scaleMargins: { top: 0.06, bottom: showVolume ? 0.24 : 0.06 },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 12,
        minBarSpacing: 2,
        visible: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      width:  containerRef.current.clientWidth,
      height: 450,
    });
    chartRef.current = chart;

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350',
      borderUpColor: '#26a69a', borderDownColor: '#ef5350',
      wickUpColor:   '#26a69a', wickDownColor:   '#ef5350',
      priceLineVisible: true, lastValueVisible: true,
    });

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        color: 'rgba(100,116,139,0.4)',
        lastValueVisible: false, priceLineVisible: false,
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volumeSeriesRef.current = volumeSeries;
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    setChartReady(true);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current        = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setChartReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVolume]);

  // ── Inicializar chart RSI ─────────────────────────────────────────
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || rsiChartRef.current) return;

    const rsiChart = createChart(rsiContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1117' },
        textColor: '#9ca3af',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1f2937', style: LineStyle.Solid },
        horzLines: { color: '#1a2332', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
        horzLine: { color: '#475569', labelBackgroundColor: '#1e293b' },
      },
      rightPriceScale: {
        borderColor: '#1f2937',
        textColor: '#9ca3af',
        scaleMargins: { top: 0.05, bottom: 0.05 },
        autoScale: false,
        // Fijar siempre la escala entre 0 y 100
        minimumWidth: 60,
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 12,
        minBarSpacing: 2,
        visible: true,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      width:  rsiContainerRef.current.clientWidth,
      height: 130,
    });
    rsiChartRef.current = rsiChart;

    // Serie RSI principal
    const rsiSeries = rsiChart.addLineSeries({
      color: '#818cf8',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'RSI 14',
    });
    rsiSeriesRef.current = rsiSeries;

    // ── PriceLines — se dibujan en TODO el ancho del gráfico siempre ──
    pl70Ref.current = rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239,83,80,0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    });
    pl50Ref.current = rsiSeries.createPriceLine({
      price: 50,
      color: 'rgba(100,116,139,0.5)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: '',
    });
    pl30Ref.current = rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(38,166,154,0.7)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: '',
    });

    const ro = new ResizeObserver(() => {
      if (rsiContainerRef.current && rsiChartRef.current)
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
    });
    ro.observe(rsiContainerRef.current);

    setRsiReady(true);
    return () => {
      ro.disconnect();
      rsiChart.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      pl70Ref.current = null;
      pl50Ref.current = null;
      pl30Ref.current = null;
      setRsiReady(false);
    };
  }, [showRSI]);

  // ── Sincronizar timeScale bidireccionalmente ──────────────────────
  useEffect(() => {
    const main = chartRef.current;
    const rsi  = rsiChartRef.current;
    if (!main || !rsi) return;

    const syncMainToRsi = () => {
      if (syncingRef.current) return;
      const range = main.timeScale().getVisibleRange();
      if (!range) return;
      syncingRef.current = true;
      try { rsi.timeScale().setVisibleRange(range); } catch { /* ignorar */ }
      syncingRef.current = false;
    };
    const syncRsiToMain = () => {
      if (syncingRef.current) return;
      const range = rsi.timeScale().getVisibleRange();
      if (!range) return;
      syncingRef.current = true;
      try { main.timeScale().setVisibleRange(range); } catch { /* ignorar */ }
      syncingRef.current = false;
    };

    main.timeScale().subscribeVisibleTimeRangeChange(syncMainToRsi);
    rsi.timeScale().subscribeVisibleTimeRangeChange(syncRsiToMain);
    return () => {
      main.timeScale().unsubscribeVisibleTimeRangeChange(syncMainToRsi);
      rsi.timeScale().unsubscribeVisibleTimeRangeChange(syncRsiToMain);
    };
  }, [chartReady, rsiReady]);

  // ── Reset zoom cuando cambia símbolo o intervalo ─────────────────
  useEffect(() => {
    initialZoomDone.current = false;
    prevDataLenRef.current  = 0;
    prevLastTimeRef.current = 0;
  }, [symbol, interval]);

  // ── Actualizar datos del chart principal ──────────────────────────
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current) return;
    if (!data || data.length === 0) return;

    try {
      const candles = buildCandleData(data);
      if (candles.length === 0) return;

      const lastCandle = candles[candles.length - 1];
      const lastTime   = lastCandle.time as number;
      const sameLen    = data.length === prevDataLenRef.current;
      const sameLast   = lastTime     === prevLastTimeRef.current;

      if (sameLen && sameLast) {
        // Actualización incremental de precio live
        candleSeriesRef.current.update(lastCandle);
        if (volumeSeriesRef.current) {
          const vd = buildVolumeData(data);
          volumeSeriesRef.current.update(vd[vd.length - 1]);
        }
      } else {
        // Carga completa
        candleSeriesRef.current.setData(candles);
        if (volumeSeriesRef.current)
          volumeSeriesRef.current.setData(buildVolumeData(data));

        // Zoom inicial: mostrar las últimas 40 velas
        if (!initialZoomDone.current) {
          const VISIBLE = 40;
          const total   = candles.length;

          if (total <= VISIBLE) {
            chartRef.current?.timeScale().fitContent();
            setTimeout(() => {
              const r = chartRef.current?.timeScale().getVisibleRange();
              if (r) {
                try { rsiChartRef.current?.timeScale().setVisibleRange(r); } catch { /* ignorar */ }
              }
            }, 60);
          } else {
            const barMs    = (candles[1].time as number) - (candles[0].time as number);
            const fromTime = candles[total - VISIBLE].time as UTCTimestamp;
            const toTime   = (candles[total - 1].time as number + barMs * 5) as UTCTimestamp;
            const range    = { from: fromTime, to: toTime };

            syncingRef.current = true;
            try {
              chartRef.current?.timeScale().setVisibleRange(range);
              rsiChartRef.current?.timeScale().setVisibleRange(range);
            } catch { /* ignorar */ }
            syncingRef.current = false;
          }
          initialZoomDone.current = true;
        }
      }

      prevDataLenRef.current  = data.length;
      prevLastTimeRef.current = lastTime;
    } catch (err) {
      console.error('[TradingViewChart] candles error:', err);
    }
  }, [chartReady, data, buildCandleData, buildVolumeData]);

  // ── Actualizar panel RSI ──────────────────────────────────────────
  useEffect(() => {
    if (!rsiReady || !rsiSeriesRef.current) return;

    if (rsiData.length === 0) {
      try { rsiSeriesRef.current.setData([]); } catch { /* ignorar */ }
      setRsiValue(null);
      setIsCalcRSI(data.length > 0 && data.length < 15);
      return;
    }

    try {
      setIsCalcRSI(false);

      // Forzar escala fija 0-100 en la serie RSI
      rsiSeriesRef.current.applyOptions({
        baseLineVisible: false,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      rsiChartRef.current?.priceScale('right').applyOptions({
        autoScale: false,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      });

      rsiSeriesRef.current.setData(rsiData);

      // Sincronizar rango de tiempo con el chart principal
      const mainRange = chartRef.current?.timeScale().getVisibleRange();
      if (mainRange && rsiChartRef.current) {
        syncingRef.current = true;
        try { rsiChartRef.current.timeScale().setVisibleRange(mainRange); } catch { /* ignorar */ }
        syncingRef.current = false;
      }

      setRsiValue(rsiData[rsiData.length - 1].value as number);
    } catch (err) {
      console.error('[TradingViewChart] RSI error:', err);
    }
  }, [rsiReady, rsiData, data.length]);

  // ── Estadísticas cabecera ──────────────────────────────────────────
  const hasData     = data && data.length > 0;
  const lastCandle  = hasData ? data[data.length - 1] : null;
  const firstCandle = hasData ? data[0] : null;
  const change      = hasData ? lastCandle!.close - firstCandle!.close : 0;
  const changePct   = hasData && firstCandle!.close !== 0 ? (change / firstCandle!.close) * 100 : 0;
  const isUp        = change >= 0;
  const periodHigh  = hasData ? Math.max(...data.map(d => d.high)) : 0;
  const periodLow   = hasData ? Math.min(...data.map(d => d.low))  : 0;
  const totalVol    = hasData ? data.reduce((s, d) => s + (d.volume || 0), 0) : 0;

  // Color e indicación del RSI
  const rsiColor = rsiValue === null ? '#9ca3af'
    : rsiValue >= 70 ? '#ef5350'
    : rsiValue <= 30 ? '#26a69a'
    : '#818cf8';
  const rsiLabel = rsiValue === null ? ''
    : rsiValue >= 70 ? ' · Sobrecompra'
    : rsiValue <= 30 ? ' · Sobreventa'
    : rsiValue > 50  ? ' · Alcista'
    : ' · Bajista';

  return (
    <div className="bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden">
      {/* Badge datos simulados */}
      {isFallback && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-[11px] text-amber-400">
          <span>⚠️</span>
          <span>API no disponible — datos <strong>simulados</strong>. Los precios no son reales.</span>
        </div>
      )}

      {/* Barra superior con OHLC */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-800 text-xs select-none">
        <span className="text-white font-bold text-sm tracking-widest">{symbol}</span>

        {hasData && lastCandle && (
          <>
            <div className="flex items-center gap-1 text-slate-400">
              <span>O</span><span className="text-white font-mono">{lastCandle.open.toFixed(2)}</span>
              <span className="ml-1">H</span><span className="text-[#26a69a] font-mono">{lastCandle.high.toFixed(2)}</span>
              <span className="ml-1">L</span><span className="text-[#ef5350] font-mono">{lastCandle.low.toFixed(2)}</span>
              <span className="ml-1">C</span>
              <span className={`font-mono font-bold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {lastCandle.close.toFixed(2)}
              </span>
            </div>
            <span className={`font-mono font-semibold ${isUp ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{changePct.toFixed(2)}%)
            </span>
            <div className="ml-auto flex items-center gap-4 text-slate-500 text-[11px]">
              <span>Max: <span className="text-slate-300">{periodHigh.toFixed(2)}</span></span>
              <span>Min: <span className="text-slate-300">{periodLow.toFixed(2)}</span></span>
              <span>Vol: <span className="text-slate-300">
                {totalVol > 1e9 ? (totalVol / 1e9).toFixed(2) + 'B'
                  : totalVol > 1e6 ? (totalVol / 1e6).toFixed(1) + 'M'
                  : (totalVol / 1e3).toFixed(0) + 'K'}
              </span></span>
            </div>
          </>
        )}
        {!hasData && <span className="text-slate-500 text-[11px] ml-2">Cargando datos…</span>}
      </div>

      {/* Chart principal */}
      <div className="relative">
        <div ref={containerRef} className="w-full" style={{ height: '450px' }} />
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#26a69a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Cargando datos de mercado…</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel RSI — siempre en DOM */}
      {showRSI && (
        <div className="border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-1.5 text-[11px] select-none bg-[#0d1117]">
            <span className="text-slate-400 font-semibold">RSI(14)</span>
            {rsiValue !== null ? (
              <span style={{ color: rsiColor }} className="font-mono font-bold">
                {rsiValue.toFixed(2)}{rsiLabel}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
                {isCalcRSI ? 'Insuficientes datos (min. 15 velas)' : 'Calculando RSI…'}
              </span>
            )}
            <div className="ml-auto flex items-center gap-3 text-slate-600">
              <span className="flex items-center gap-1">
                <span className="inline-block w-5 border-t-2 border-dashed border-[#ef5350]/70" />
                <span>70</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-5 border-t-2 border-dashed border-[#26a69a]/70" />
                <span>30</span>
              </span>
            </div>
          </div>

          <div className="relative">
            <div ref={rsiContainerRef} className="w-full" style={{ height: '130px' }} />
            {rsiData.length === 0 && hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/90">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="w-4 h-4 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
                  Calculando RSI…
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leyenda inferior */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#26a69a] inline-block" />Alcista
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#ef5350] inline-block" />Bajista
        </div>
        {showVolume && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-3 bg-slate-600/50 inline-block rounded-sm" />Volumen
          </div>
        )}
      </div>
    </div>
  );
}
