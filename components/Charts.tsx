'use client';

import React, { useMemo } from 'react';
import { CandleData } from '@/lib/types';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface PriceChartProps {
  data: CandleData[];
  symbol: string;
  showVolume?: boolean;
  indicators?: {
    sma20?: number[];
    ema12?: number[];
    rsi?: number[];
  };
}

export function PriceChart({ data, symbol, showVolume = true, indicators }: PriceChartProps) {
  // Mostrar solo últimas 50 velas para claridad
  const displayData = useMemo(() => {
    const lastData = data.slice(-50);
    return lastData.map((candle, index) => ({
      time: format(new Date(candle.time), 'HH:mm'),
      close: parseFloat(candle.close.toFixed(2)),
      open: parseFloat(candle.open.toFixed(2)),
      high: parseFloat(candle.high.toFixed(2)),
      low: parseFloat(candle.low.toFixed(2)),
      volume: candle.volume,
      sma20: indicators?.sma20?.[data.length - 50 + index] ?? null,
      ema12: indicators?.ema12?.[data.length - 50 + index] ?? null,
    }));
  }, [data, indicators]);

  const stats = useMemo(() => {
    if (displayData.length === 0) return { min: 0, max: 100, avg: 50, change: 0 };
    const closes = displayData.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const avg = (min + max) / 2;
    const change = displayData[displayData.length - 1].close - displayData[0].close;
    return { min, max, avg, change };
  }, [displayData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-cyan-500/50 p-3 rounded-lg text-xs">
          <p className="text-cyan-400 font-semibold">{data.time}</p>
          <p className="text-white">Cierre: ${data.close.toFixed(2)}</p>
          <p className="text-slate-300">Alto: ${data.high.toFixed(2)}</p>
          <p className="text-slate-300">Bajo: ${data.low.toFixed(2)}</p>
          {data.volume && <p className="text-slate-400 text-xs mt-1">Vol: {(data.volume / 1e6).toFixed(1)}M</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{symbol}</h2>
          <p className="text-sm text-slate-400">Últimas 50 velas</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${displayData[displayData.length - 1]?.close.toFixed(2) || '0.00'}
          </p>
          <p className={`text-sm ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico de precios */}
      <div className="w-full h-80 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#22d3ee"
              strokeWidth={2}
              fill="url(#colorClose)"
              isAnimationActive={false}
            />
            {indicators?.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#fbbf24"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="SMA(20)"
              />
            )}
            {indicators?.ema12 && (
              <Line
                type="monotone"
                dataKey="ema12"
                stroke="#f87171"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                name="EMA(12)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <p className="text-slate-400 text-xs">Máximo</p>
          <p className="text-cyan-400 font-bold">${stats.max.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <p className="text-slate-400 text-xs">Mínimo</p>
          <p className="text-red-400 font-bold">${stats.min.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <p className="text-slate-400 text-xs">Promedio</p>
          <p className="text-yellow-400 font-bold">${stats.avg.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/20">
          <p className="text-slate-400 text-xs">Cambio</p>
          <p className={`font-bold ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Volumen */}
      {showVolume && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300">Volumen</h3>
          <div className="w-full h-20 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '11px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="#22d3ee" opacity={0.6} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

interface RSIChartProps {
  data: number[];
}

export function RSIChart({ data }: RSIChartProps) {
  // Mostrar solo últimos 50 valores
  const displayData = useMemo(() => {
    const lastData = data.slice(-50);
    return lastData.map((rsi, index) => ({
      index: index + 1,
      rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
    }));
  }, [data]);

  const CustomRSITooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      let status: string;
      let color: string;

      if (value > 70) {
        status = 'Sobrecomprado';
        color = 'text-red-400';
      } else if (value < 30) {
        status = 'Sobrevendido';
        color = 'text-emerald-400';
      } else if (value > 50) {
        status = 'Alcista';
        color = 'text-emerald-400';
      } else {
        status = 'Bajista';
        color = 'text-red-400';
      }

      return (
        <div className="bg-slate-950 border border-cyan-500/50 p-2 rounded-lg text-xs">
          <p className={`font-semibold ${color}`}>{value?.toFixed(2) || '0'}</p>
          <p className="text-slate-400">{status}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-white">RSI (14)</h3>
        <p className="text-sm text-slate-400">Índice de Fuerza Relativa - Últimos 50 valores</p>
      </div>

      <div className="w-full h-72 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="index" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 100]} stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomRSITooltip />} />

            <ReferenceLine
              y={70}
              stroke="#f87171"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: '70 - Sobrecomprado',
                position: 'right',
                fill: '#f87171',
                fontSize: 11,
              }}
            />
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: '30 - Sobrevendido',
                position: 'right',
                fill: '#10b981',
                fontSize: 11,
              }}
            />
            <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1} />

            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-slate-400 text-xs">Sobrecomprado</p>
          <p className="text-red-400 font-bold">RSI {'>'} 70</p>
        </div>
        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
          <p className="text-slate-400 text-xs">Sobrevendido</p>
          <p className="text-emerald-400 font-bold">RSI {'<'} 30</p>
        </div>
      </div>
    </div>
  );
}



