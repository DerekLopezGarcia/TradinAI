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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
  // Memoizar transformación de datos para evitar recalcular en cada render
  const chartData = useMemo(() =>
    data.map((candle, index) => ({
      time: format(new Date(candle.time), 'HH:mm'),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      sma20: indicators?.sma20?.[index] ?? null,
      ema12: indicators?.ema12?.[index] ?? null,
    })),
    [data, indicators]
  );

  // Memoizar cálculos de min/max para evitar recalcular
  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    if (data.length === 0) return { minPrice: 0, maxPrice: 100, avgPrice: 50 };
    const prices = data.map(d => d.low);
    const highs = data.map(d => d.high);
    const min = Math.min(...prices);
    const max = Math.max(...highs);
    return {
      minPrice: min,
      maxPrice: max,
      avgPrice: (min + max) / 2,
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass p-3 rounded-lg border border-muted text-xs">
          <p className="text-muted-foreground">{data.time}</p>
          <p className="text-foreground">Abierto: ${data.open.toFixed(2)}</p>
          <p className="text-foreground">Alto: ${data.high.toFixed(2)}</p>
          <p className="text-foreground">Bajo: ${data.low.toFixed(2)}</p>
          <p className="font-semibold">{data.close >= data.open ? '🟢' : '🔴'} Cierre: ${data.close.toFixed(2)}</p>
          {data.volume && <p className="text-muted-foreground">Vol: {(data.volume / 1e6).toFixed(2)}M</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-glass">
      <div className="mb-4">
        <h2 className="text-lg font-bold">{symbol}</h2>
        <p className="text-sm text-muted-foreground">Gráfico de precios en tiempo real</p>
      </div>

      {/* Gráfico de precios */}
      <div className="w-full h-80 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.2)" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[minPrice * 0.99, maxPrice * 1.01]}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorPrice)"
              isAnimationActive={false}
            />
            {indicators?.sma20 && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="hsl(var(--accent))"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
                name="SMA(20)"
              />
            )}
            {indicators?.ema12 && (
              <Line
                type="monotone"
                dataKey="ema12"
                stroke="hsl(var(--secondary))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                name="EMA(12)"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de volumen */}
      {showVolume && (
        <div className="mt-6 pt-6 border-t border-muted/30">
          <h3 className="text-sm font-semibold mb-4">Volumen</h3>
          <div className="w-full h-24 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.2)" />
                <XAxis
                  dataKey="time"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  width={60}
                />
                <Bar
                  dataKey="volume"
                  fill="hsl(var(--accent)/0.5)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Información de estadísticas */}
      <div className="mt-6 grid grid-cols-4 gap-3 text-sm">
        <div className="p-3 bg-muted/10 rounded-lg">
          <p className="text-muted-foreground text-xs">Alto</p>
          <p className="font-semibold">${maxPrice.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-muted/10 rounded-lg">
          <p className="text-muted-foreground text-xs">Bajo</p>
          <p className="font-semibold">${minPrice.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-muted/10 rounded-lg">
          <p className="text-muted-foreground text-xs">Promedio</p>
          <p className="font-semibold">${avgPrice.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-muted/10 rounded-lg">
          <p className="text-muted-foreground text-xs">Velas</p>
          <p className="font-semibold">{data.length}</p>
        </div>
      </div>
    </div>
  );
}

interface RSIChartProps {
  data: number[];
}

export function RSIChart({ data }: RSIChartProps) {
  const chartData = useMemo(() =>
    data.map((rsi, index) => ({
      index,
      rsi: rsi || null,
    })),
    [data]
  );

  return (
    <div className="card-glass">
      <h3 className="text-lg font-bold mb-4">RSI (14)</h3>
      <div className="w-full h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.2)" />
            <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--muted))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {/* Líneas de referencia */}
            <Line
              type="monotone"
              dataKey={() => 70}
              stroke="hsl(var(--secondary)/0.5)"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Overbought (70)"
            />
            <Line
              type="monotone"
              dataKey={() => 30}
              stroke="hsl(var(--primary)/0.5)"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="Oversold (30)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

