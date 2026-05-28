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
import { calculateRSI, calculateSMA, calculateEMA, calculateADX, calculateStochastic, calculateBollingerBands } from '@/lib/indicators';
import { useTheme } from 'next-themes';
import { marketHoursService } from '@/lib/services/marketHoursService';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface TradingViewChartProps {
  data: CandleData[];
  symbol: string;
  interval?: string;
  showVolume?: boolean;
  showRSI?: boolean;
  showBollinger?: boolean;
  onIndicatorsUpdate?: (indicators: { sma: number | null; ema: number | null; rsi: number | null; adx: number | null; stochasticK: number | null; stochasticD: number | null }) => void;
}

export function TradingViewChart({
  data,
  symbol,
  interval = '1h',
  showVolume = false,
  showRSI = false,
  showBollinger = false,
  onIndicatorsUpdate,
}: TradingViewChartProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const bollingerUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bollingerMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);

  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const rsiChartRef     = useRef<IChartApi | null>(null);
  const rsiSeriesRef    = useRef<ISeriesApi<'Line'> | null>(null);

  const syncingRef      = useRef<boolean>(false);
  const prevDataLenRef  = useRef<number>(0);
  const prevLastTimeRef = useRef<number>(0);
  const initialZoomDone = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const isDark = resolvedTheme === 'dark';

  const [chartReady, setChartReady] = useState(false);
  const [rsiReady,   setRsiReady]   = useState(false);
  const [rsiValue,   setRsiValue]   = useState<number | null>(null);
  const [smaValue,   setSmaValue]   = useState<number | null>(null);
  const [emaValue,   setEmaValue]   = useState<number | null>(null);
  const [adxValue,   setAdxValue]   = useState<number | null>(null);
  const [stochasticK, setStochasticK] = useState<number | null>(null);
  const [stochasticD, setStochasticD] = useState<number | null>(null);

  // Theme-aware colors
  const colors = useMemo(() => ({
    background: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#94a3b8' : '#475569',
    grid: isDark ? '#1e293b' : '#e2e8f0',
    border: isDark ? '#334155' : '#cbd5e1',
    upColor: '#22c55e',
    downColor: '#ef4444',
    rsiColor: '#8b5cf6',
  }), [isDark]);

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

  const syncRsiToMainRange = useCallback(() => {
    const main = chartRef.current;
    const rsi = rsiChartRef.current;
    if (!main || !rsi || !rsiReady) return;

    const timeRange = main.timeScale().getVisibleRange();
    if (!timeRange) return;

    syncingRef.current = true;
    try {
      rsi.timeScale().setVisibleRange(timeRange);
    } catch {
      /* ignorar */
    }
    syncingRef.current = false;
  }, [rsiReady]);

  const applyInitialVisibleRange = useCallback((candles: CandlestickData[]) => {
    const main = chartRef.current;
    if (!main || candles.length === 0) return;

    const total = candles.length;
    const visibleBars = Math.min(Math.max(total >= 50 ? 50 : 30, 30), 50, total);

    if (total <= visibleBars) {
      try {
        main.timeScale().fitContent();
      } catch {
        /* ignorar */
      }
      requestAnimationFrame(() => {
        syncRsiToMainRange();
      });
      return;
    }

    const fromCandle = candles[Math.max(0, total - visibleBars)];
    const toCandle = candles[total - 1];
    const range = { from: fromCandle.time as UTCTimestamp, to: toCandle.time as UTCTimestamp };

    syncingRef.current = true;
    try {
      main.timeScale().setVisibleRange(range);
      rsiChartRef.current?.timeScale().setVisibleRange(range);
    } catch {
      /* ignorar */
    }
    syncingRef.current = false;
  }, [syncRsiToMainRange]);

  const restoreVisibleRange = useCallback(() => {
    const main = chartRef.current;
    if (!main) return;
  }, []);

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

  // Actualizar colores cuando cambia el tema
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid, style: LineStyle.Solid },
        horzLines: { color: colors.grid, style: LineStyle.Solid },
      },
      crosshair: {
        vertLine: { color: '#64748b', labelBackgroundColor: colors.border },
        horzLine: { color: '#64748b', labelBackgroundColor: colors.border },
      },
      rightPriceScale: {
        borderColor: colors.border,
        textColor: colors.text,
      },
      timeScale: {
        borderColor: colors.border,
      },
    });

    if (rsiChartRef.current) {
      rsiChartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: colors.background },
          textColor: colors.text,
        },
        grid: {
          vertLines: { color: colors.grid },
          horzLines: { color: colors.grid },
        },
        rightPriceScale: {
          borderColor: colors.border,
        },
        timeScale: {
          borderColor: colors.border,
        },
      });
    }
  }, [colors]);

  // ...existing code...
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: colors.grid, style: LineStyle.Solid },
        horzLines: { color: colors.grid, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#64748b', labelBackgroundColor: colors.border },
        horzLine: { color: '#64748b', labelBackgroundColor: colors.border },
      },
      rightPriceScale: {
        borderColor: colors.border,
        textColor: colors.text,
        scaleMargins: { top: 0.06, bottom: showVolume ? 0.24 : 0.06 },
      },
      timeScale: {
        borderColor: colors.border,
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

    // Agregar series para Bollinger Bands
    if (showBollinger) {
      bollingerUpperRef.current = chart.addLineSeries({
        color: '#818cf8',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
      });
      bollingerMiddleRef.current = chart.addLineSeries({
        color: '#64748b',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
      });
      bollingerLowerRef.current = chart.addLineSeries({
        color: '#818cf8',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
      });
    }

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

  // LIMPIAR RSI CHART CUANDO CAMBIA INTERVALO
  useEffect(() => {
    if (rsiChartRef.current) {
      try {
        rsiChartRef.current.remove();
      } catch {
        /* ignorar */
      }
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      setRsiReady(false);
    }
  }, [symbol, interval]);

  // INICIALIZAR NUEVO RSI CHART DE CERO
  useEffect(() => {
    if (!showRSI || !rsiContainerRef.current || rsiChartRef.current) return;

    const initRsi = () => {
      if (!rsiContainerRef.current) return;

      const w = rsiContainerRef.current.clientWidth;
      if (w <= 0) {
        requestAnimationFrame(initRsi);
        return;
      }

      try {
        // Crear chart RSI nuevo
        const rsiChart = createChart(rsiContainerRef.current, {
          layout: { background: { type: ColorType.Solid, color: colors.background }, textColor: colors.text },
          grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
          rightPriceScale: { borderColor: colors.border, autoScale: true, scaleMargins: { top: 0.2, bottom: 0.2 } },
          timeScale: {
            borderColor: colors.border,
            timeVisible: true,
            secondsVisible: true,
          },
          width: w,
          height: 130,
        });

        rsiChartRef.current = rsiChart;

        // Agregar línea del RSI
        const rsiLine = rsiChart.addLineSeries({ color: colors.rsiColor, lineWidth: 2 });
        rsiSeriesRef.current = rsiLine;

        // Líneas de referencia
        rsiLine.createPriceLine({ price: 70, color: '#ef5350', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
        rsiLine.createPriceLine({ price: 30, color: '#26a69a', lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true });
        rsiLine.createPriceLine({ price: 50, color: '#64748b', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false });

        // Observer para resize
        const ro = new ResizeObserver(() => {
          if (rsiContainerRef.current && rsiChartRef.current) {
            rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth });
          }
        });
        ro.observe(rsiContainerRef.current);

        setRsiReady(true);

        return () => {
          ro.disconnect();
        };
      } catch (err) {
        console.error('Error init RSI:', err);
      }
    };

    initRsi();
  }, [showRSI, symbol, interval]);

  // SINCRONIZAR TIMERANGE ENTRE CHARTS
  useEffect(() => {
    const main = chartRef.current;
    const rsi = rsiChartRef.current;
    if (!main || !rsi) return;

    const syncTimeRange = () => {
      const range = main.timeScale().getVisibleRange();
      if (range) {
        try {
          rsi.timeScale().setVisibleRange(range);
        } catch {
          /* ignorar */
        }
      }
    };

    main.timeScale().subscribeVisibleTimeRangeChange(syncTimeRange);
    return () => {
      main.timeScale().unsubscribeVisibleTimeRangeChange(syncTimeRange);
    };
  }, [chartReady, rsiReady]);

  useEffect(() => {
    initialZoomDone.current = false;
    prevDataLenRef.current  = 0;
    prevLastTimeRef.current = 0;
    userInteractedRef.current = false;
  }, [symbol, interval]);

  // AGREGAR LÍNEAS DE APERTURA Y CIERRE DE MERCADO
  useEffect(() => {
    if (!chartRef.current || !symbol || data.length === 0) return;

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries) return;

    try {
      const marketHours = marketHoursService.getMarketHours(symbol);
      
      // Si es cripto o forex (24/7), no mostrar líneas
      if (marketHours.isOpen24) return;

      // Calcular timestamps de apertura y cierre en UTC
      const today = new Date();
      const openTimeToday = new Date(today);
      openTimeToday.setUTCHours(marketHours.openTime.hour, marketHours.openTime.minute, 0, 0);
      
      const closeTimeToday = new Date(today);
      closeTimeToday.setUTCHours(marketHours.closeTime.hour, marketHours.closeTime.minute, 0, 0);

      const openTimestamp = Math.floor(openTimeToday.getTime() / 1000) as UTCTimestamp;
      const closeTimestamp = Math.floor(closeTimeToday.getTime() / 1000) as UTCTimestamp;

      // Crear líneas de precio para marcar apertura y cierre
      candleSeries.createPriceLine({
        price: 0, // El precio será dinámico, esto es solo un placeholder
        color: '#22c55e',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: `${t('tradingView.marketOpen')}: ${marketHours.openTime.hour.toString().padStart(2, '0')}:${marketHours.openTime.minute.toString().padStart(2, '0')} UTC`,
      });

      candleSeries.createPriceLine({
        price: 0,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: `${t('tradingView.marketClose')}: ${marketHours.closeTime.hour.toString().padStart(2, '0')}:${marketHours.closeTime.minute.toString().padStart(2, '0')} UTC`,
      });
    } catch (err) {
      console.error('[TradingViewChart] Error adding market hours lines:', err);
    }
  }, [symbol, data.length, chartReady]);

  // ...existing code...
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
        candleSeriesRef.current.update(lastCandle);
        if (volumeSeriesRef.current) {
          const vd = buildVolumeData(data);
          volumeSeriesRef.current.update(vd[vd.length - 1]);
        }
       } else {
         candleSeriesRef.current.setData(candles);
         if (volumeSeriesRef.current)
           volumeSeriesRef.current.setData(buildVolumeData(data));

        if (!initialZoomDone.current) {
            applyInitialVisibleRange(candles);
            initialZoomDone.current = true;
          } else if (userInteractedRef.current) {
            restoreVisibleRange();
          }
        }

       prevDataLenRef.current  = data.length;
       prevLastTimeRef.current = lastTime;
     } catch (err) {
       console.error('[TradingViewChart] candles error:', err);
     }
   }, [chartReady, rsiReady, data, buildCandleData, buildVolumeData, applyInitialVisibleRange, restoreVisibleRange]);

  // ACTUALIZAR DATOS DEL RSI
  useEffect(() => {
    if (!rsiReady || !rsiSeriesRef.current) return;
    if (!rsiData || rsiData.length === 0) {
      setRsiValue(null);
      return;
    }

    try {
      rsiSeriesRef.current.setData(rsiData);
      const lastRsi = rsiData[rsiData.length - 1]?.value as number;
      setRsiValue(isNaN(lastRsi) ? null : lastRsi);
    } catch (err) {
      console.error('Error updating RSI:', err);
    }
  }, [rsiReady, rsiData]);


  useEffect(() => {
    if (!data || data.length < 20) {
      setSmaValue(null);
      setEmaValue(null);
      setAdxValue(null);
      setStochasticK(null);
      setStochasticD(null);
      return;
    }

    try {
      const closes = data.map(d => +d.close);
      const highs = data.map(d => +d.high);
      const lows = data.map(d => +d.low);
      const smaValues = calculateSMA(closes, 20);
      const emaValues = calculateEMA(closes, 20);
      const adxValues = calculateADX(highs, lows, closes, 14);
      const stochasticData = calculateStochastic(highs, lows, closes, 14, 3);

      const lastSma = smaValues[smaValues.length - 1];
      const lastEma = emaValues[emaValues.length - 1];
      const lastAdx = adxValues[adxValues.length - 1];

      setSmaValue(lastSma > 0 ? lastSma : null);
      setEmaValue(lastEma > 0 ? lastEma : null);
      setAdxValue(!isNaN(lastAdx) && isFinite(lastAdx) ? lastAdx : null);
      
      // Extraer últimos valores válidos de Stochastic
      let lastK: number | null = null;
      let lastD: number | null = null;
      
      for (let i = stochasticData.k.length - 1; i >= 0; i--) {
        if (!isNaN(stochasticData.k[i])) {
          lastK = stochasticData.k[i];
          break;
        }
      }
      
      for (let i = stochasticData.d.length - 1; i >= 0; i--) {
        if (!isNaN(stochasticData.d[i])) {
          lastD = stochasticData.d[i];
          break;
        }
      }
      
      setStochasticK(lastK !== null ? lastK : null);
      setStochasticD(lastD !== null ? lastD : null);
    } catch (err) {
      console.error('[TradingViewChart] SMA/EMA/ADX/Stochastic error:', err);
      setSmaValue(null);
      setEmaValue(null);
      setAdxValue(null);
      setStochasticK(null);
      setStochasticD(null);
    }
  }, [data]);

  useEffect(() => {
    onIndicatorsUpdate?.({ sma: smaValue, ema: emaValue, rsi: rsiValue, adx: adxValue, stochasticK, stochasticD });
  }, [smaValue, emaValue, rsiValue, adxValue, stochasticK, stochasticD, onIndicatorsUpdate]);

  // ACTUALIZAR BANDAS DE BOLLINGER
  useEffect(() => {
    if (!chartReady) return;
    
    // Si no queremos mostrar Bollinger, limpiar las series
    if (!showBollinger) {
      if (bollingerUpperRef.current && chartRef.current) {
        try {
          if (bollingerUpperRef.current) chartRef.current.removeSeries(bollingerUpperRef.current);
          if (bollingerLowerRef.current) chartRef.current.removeSeries(bollingerLowerRef.current);
          if (bollingerMiddleRef.current) chartRef.current.removeSeries(bollingerMiddleRef.current);
        } catch (e) {
          // ignorar
        }
      }
      bollingerUpperRef.current = null;
      bollingerLowerRef.current = null;
      bollingerMiddleRef.current = null;
      return;
    }

    if (!data || data.length < 20 || !chartRef.current) return;

    try {
      const closes = data.map(d => +d.close);
      const bands = calculateBollingerBands(closes, 20, 2);
      
      // Crear series si no existen
      if (!bollingerUpperRef.current) {
        bollingerUpperRef.current = chartRef.current.addLineSeries({
          color: '#818cf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
      }
      if (!bollingerMiddleRef.current) {
        bollingerMiddleRef.current = chartRef.current.addLineSeries({
          color: '#64748b',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
        });
      }
      if (!bollingerLowerRef.current) {
        bollingerLowerRef.current = chartRef.current.addLineSeries({
          color: '#818cf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
      }

      // Convertir datos a formato de línea
      const upperData: LineData[] = [];
      const middleData: LineData[] = [];
      const lowerData: LineData[] = [];

      for (let i = 0; i < data.length; i++) {
        const upper = bands.upper[i];
        const middle = bands.middle[i];
        const lower = bands.lower[i];

        if (upper > 0 && isFinite(upper)) {
          upperData.push({ time: toUTC(data[i].time), value: upper });
        }
        if (middle > 0 && isFinite(middle)) {
          middleData.push({ time: toUTC(data[i].time), value: middle });
        }
        if (lower > 0 && isFinite(lower)) {
          lowerData.push({ time: toUTC(data[i].time), value: lower });
        }
      }

      // Actualizar series
      if (upperData.length > 0 && bollingerUpperRef.current) {
        bollingerUpperRef.current.setData(upperData);
      }
      if (middleData.length > 0 && bollingerMiddleRef.current) {
        bollingerMiddleRef.current.setData(middleData);
      }
      if (lowerData.length > 0 && bollingerLowerRef.current) {
        bollingerLowerRef.current.setData(lowerData);
      }
    } catch (err) {
      console.error('[TradingViewChart] Bollinger Bands error:', err);
    }
  }, [chartReady, showBollinger, data, toUTC]);

  const hasData     = data && data.length > 0;
  const lastCandle  = hasData ? data[data.length - 1] : null;
  const firstCandle = hasData ? data[0] : null;
  const change      = hasData ? lastCandle!.close - firstCandle!.close : 0;
  const changePct   = hasData && firstCandle!.close !== 0 ? (change / firstCandle!.close) * 100 : 0;
  const isUp        = change >= 0;
  const periodHigh  = hasData ? Math.max(...data.map(d => d.high)) : 0;
  const periodLow   = hasData ? Math.min(...data.map(d => d.low))  : 0;
  const totalVol    = hasData ? data.reduce((s, d) => s + (d.volume || 0), 0) : 0;

  const rsiColor = rsiValue === null ? '#9ca3af'
    : rsiValue >= 70 ? '#ef5350'
    : rsiValue <= 30 ? '#26a69a'
    : '#818cf8';
  const rsiLabel = rsiValue === null ? ''
    : rsiValue >= 70 ? ` · ${t('tradingView.overbought')}`
    : rsiValue <= 30 ? ` · ${t('tradingView.oversold')}`
    : rsiValue > 50  ? ` · ${t('tradingView.bullish')}`
    : ` · ${t('tradingView.bearish')}`;

  return (
    <div className="bg-[#0d1117] rounded-xl border border-slate-800 overflow-hidden" suppressHydrationWarning>
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
        {!hasData && <span className="text-slate-500 text-[11px] ml-2">{t('tradingView.loadingData')}</span>}
      </div>

      <div className="relative">
        <div ref={containerRef} className="w-full" style={{ height: '450px' }} />
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#26a69a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">{t('tradingView.loadingMarketData')}</p>
            </div>
          </div>
        )}
      </div>

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
                {t('tradingView.calculatingRsi')}
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

          <div className="relative w-full" style={{ height: '130px', minHeight: '130px' }}>
            <div ref={rsiContainerRef} style={{ width: '100%', height: '100%' }} />
            {rsiData.length === 0 && hasData && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/90">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="w-4 h-4 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
                  {t('tradingView.calculatingRsi')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-900/30">
        <div className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-3 rounded-sm bg-[#26a69a]" />
            <span className="w-1.5 h-3 rounded-sm bg-[#ef5350]" />
          </span>
          <span className="text-slate-300 font-medium text-xs">{t('tradingView.legendBullBear')}</span>
        </div>

        {showVolume && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-600/50 rounded-sm" />
            <span className="text-slate-300 font-medium text-xs">{t('tradingView.legendVolume')}</span>
          </div>
        )}

        {showRSI && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#8b5cf6]" />
            <span className="text-slate-300 font-medium text-xs">RSI(14)</span>
          </div>
        )}

        {showBollinger && (
          <div className="flex items-center gap-1.5">
            <span className="flex gap-1">
              <span className="w-2 h-0.5 bg-[#818cf8]" />
              <span className="w-1.5 h-1 bg-[#64748b]" />
              <span className="w-2 h-0.5 bg-[#818cf8]" />
            </span>
            <span className="text-slate-300 font-medium text-xs">Bollinger</span>
          </div>
        )}
      </div>
    </div>
  );
}

