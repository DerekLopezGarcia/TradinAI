'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { createChart, ColorType, UTCTimestamp } from 'lightweight-charts';
import { CandleData } from '@/lib/types';
import { format } from 'date-fns';

interface TradingViewChartProps {
  data: CandleData[];
  symbol: string;
  showVolume?: boolean;
  indicators?: {
    sma20?: number[];
    ema12?: number[];
    rsi?: number[];
  };
}

export function TradingViewChart({ data, symbol, showVolume = true, indicators }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const smaLineRef = useRef<any>(null);
  const emaLineRef = useRef<any>(null);

  // Validar que data no esté vacío
  if (!data || data.length === 0) {
    return (
      <div className="p-6 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800">
        <div className="h-96 flex items-center justify-center">
          <p className="text-slate-400 text-center">
            ⏳ Cargando gráfico...
            <br />
            <span className="text-xs text-slate-500">Por favor espera mientras se obtienen los datos del mercado</span>
          </p>
        </div>
      </div>
    );
  }

  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    return data.map((candle) => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp, // Convertir a segundos para TradingView
      open: parseFloat(candle.open.toFixed(2)),
      high: parseFloat(candle.high.toFixed(2)),
      low: parseFloat(candle.low.toFixed(2)),
      close: parseFloat(candle.close.toFixed(2)),
      volume: candle.volume,
    }));
  }, [data]);

  // Calcular datos para volumen con colores
  const volumeData = useMemo(() => {
    return chartData.map((candle, index) => {
      const color = candle.close >= candle.open ? '#10b981' : '#ef4444';
      return {
        time: candle.time,
        value: candle.volume,
        color: color,
      };
    });
  }, [chartData]);

  // Procesar datos de indicadores
  const smaData = useMemo(() => {
    if (!indicators?.sma20 || indicators.sma20.length === 0) return [];

    const startIndex = Math.max(0, data.length - indicators.sma20.length);
    return data.slice(startIndex).map((candle, index) => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp,
      value: indicators.sma20![index] ?? null,
    })).filter(item => item.value !== null);
  }, [data, indicators?.sma20]);

  const emaData = useMemo(() => {
    if (!indicators?.ema12 || indicators.ema12.length === 0) return [];

    const startIndex = Math.max(0, data.length - indicators.ema12.length);
    return data.slice(startIndex).map((candle, index) => ({
      time: Math.floor(candle.time / 1000) as UTCTimestamp,
      value: indicators.ema12![index] ?? null,
    })).filter(item => item.value !== null);
  }, [data, indicators?.ema12]);

  // Inicializar el gráfico
  useEffect(() => {
    if (!containerRef.current) return;

    // Crear gráfico
    const chart = createChart(containerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#0f172a',
        },
        textColor: '#94a3b8',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Serie de velas
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#059669',
      borderDownColor: '#dc2626',
      wickUpColor: '#059669',
      wickDownColor: '#dc2626',
    });

    candleSeriesRef.current = candleSeries;
    candleSeries.setData(chartData);

    // Serie de volumen
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#22d3ee',
      });
      volumeSeriesRef.current = volumeSeries;
      volumeSeries.setData(volumeData);
    }

    // SMA20
    if (smaData.length > 0) {
      const smaLine = chart.addLineSeries({
        color: '#fbbf24',
        lineWidth: 2,
        title: 'SMA(20)',
      });
      smaLineRef.current = smaLine;
      smaLine.setData(smaData);
    }

    // EMA12
    if (emaData.length > 0) {
      const emaLine = chart.addLineSeries({
        color: '#fb923c',
        lineWidth: 2,
        lineStyle: 1,
        title: 'EMA(12)',
      });
      emaLineRef.current = emaLine;
      emaLine.setData(emaData);
    }

    // Ajustar escala automáticamente
    chart.timeScale().fitContent();

    // Manejo de redimensionamiento
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData, volumeData, smaData, emaData, showVolume]);

  // Actualizar datos cuando cambian
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    candleSeriesRef.current.setData(chartData);
  }, [chartData]);

  useEffect(() => {
    if (!volumeSeriesRef.current) return;
    volumeSeriesRef.current.setData(volumeData);
  }, [volumeData]);

  useEffect(() => {
    if (!smaLineRef.current) return;
    smaLineRef.current.setData(smaData);
  }, [smaData]);

  useEffect(() => {
    if (!emaLineRef.current) return;
    emaLineRef.current.setData(emaData);
  }, [emaData]);

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 100, avg: 50, change: 0, firstClose: 0, lastClose: 0 };
    }

    const closes = chartData.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const avg = (min + max) / 2;
    const firstClose = chartData[0].close;
    const lastClose = chartData[chartData.length - 1].close;
    const change = lastClose - firstClose;

    return { min, max, avg, change, firstClose, lastClose };
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Header con información del símbolo */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{symbol}</h2>
          <p className="text-xs text-slate-500 mt-1">Gráfico TradingView Lightweight Charts</p>
        </div>
        <div className="text-right space-y-2">
          <p className={`text-3xl font-bold ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${stats.lastClose.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.change >= 0 ? '▲' : '▼'} {Math.abs(stats.change).toFixed(2)} ({((stats.change / stats.firstClose) * 100).toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-5 gap-2 text-xs bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Máximo</p>
          <p className="text-emerald-400 font-bold text-sm mt-1">${stats.max.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Mínimo</p>
          <p className="text-red-400 font-bold text-sm mt-1">${stats.min.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Apertura</p>
          <p className="text-cyan-300 font-bold text-sm mt-1">${chartData[0]?.open.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Rango</p>
          <p className="text-yellow-300 font-bold text-sm mt-1">${(stats.max - stats.min).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Promedio</p>
          <p className="text-blue-300 font-bold text-sm mt-1">${stats.avg.toFixed(2)}</p>
        </div>
      </div>

      {/* Gráfico TradingView */}
      <div className="w-full bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: '400px' }}
        />
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs px-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
          <span className="text-slate-400">Sube (vs anterior)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
          <span className="text-slate-400">Baja (vs anterior)</span>
        </div>
        {indicators?.sma20 && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-yellow-400"></div>
            <span className="text-slate-400">SMA(20)</span>
          </div>
        )}
        {indicators?.ema12 && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-orange-400"></div>
            <span className="text-slate-400">EMA(12)</span>
          </div>
        )}
      </div>
    </div>
  );
}

