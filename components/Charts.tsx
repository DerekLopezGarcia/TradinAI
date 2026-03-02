'use client';

import React, { useMemo, useState } from 'react';
import { CandleData } from '@/lib/types';
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
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
  const [zoomLevel, setZoomLevel] = useState(50);

  // Validar que data no esté vacío
  if (!data || data.length === 0) {
    return (
      <div className="p-6 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800">
        <div className="h-96 flex items-center justify-center">
          <p className="text-slate-400 text-center">
            ⏳ Cargando datos de velas japonesas...
            <br />
            <span className="text-xs text-slate-500">Por favor espera mientras se obtienen los datos del mercado</span>
          </p>
        </div>
      </div>
    );
  }

  // Calcular cuántas velas mostrar basado en el zoom
  const candlesToShow = Math.max(10, Math.min(100, Math.ceil(50 + (zoomLevel - 50) * 0.5)));

  const displayData = useMemo(() => {
    const startIndex = Math.max(0, data.length - candlesToShow);
    const lastData = data.slice(startIndex);

    return lastData.map((candle, index) => ({
      timestamp: candle.time,
      time: format(new Date(candle.time), 'HH:mm'),
      date: format(new Date(candle.time), 'dd/MM'),
      close: parseFloat(candle.close.toFixed(2)),
      open: parseFloat(candle.open.toFixed(2)),
      high: parseFloat(candle.high.toFixed(2)),
      low: parseFloat(candle.low.toFixed(2)),
      volume: candle.volume,
      sma20: indicators?.sma20?.[data.length - candlesToShow + index] ?? null,
      ema12: indicators?.ema12?.[data.length - candlesToShow + index] ?? null,
    }));
  }, [data, indicators, candlesToShow]);

  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return { min: 0, max: 100, avg: 50, change: 0, firstClose: 0, lastClose: 0 };
    }

    const closes = displayData.map(d => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const avg = (min + max) / 2;
    const firstClose = displayData[0].close;
    const lastClose = displayData[displayData.length - 1].close;
    const change = lastClose - firstClose;

    return { min, max, avg, change, firstClose, lastClose };
  }, [displayData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload || payload[0];
      if (!data) return null;

      const isGreen = data.close >= data.open;

      return (
        <div className="bg-slate-950 border border-emerald-500/80 p-4 rounded-lg text-xs shadow-2xl">
          <p className="text-emerald-400 font-bold text-sm mb-2">{data.time} {data.date}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Apertura:</span>
              <span className="text-white font-semibold">${data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Cierre:</span>
              <span className={isGreen ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                ${data.close.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Máximo:</span>
              <span className="text-cyan-300 font-semibold">${data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Mínimo:</span>
              <span className="text-orange-300 font-semibold">${data.low.toFixed(2)}</span>
            </div>
            {data.volume && (
              <p className="text-slate-500 text-xs mt-2">Vol: {(data.volume / 1e6).toFixed(1)}M</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800">
      {/* Header con información del símbolo */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-white">{symbol}</h2>
          <p className="text-xs text-slate-500 mt-1">Gráfico de Barras Coloreadas | {candlesToShow} barras visibles</p>
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
          <p className="text-cyan-300 font-bold text-sm mt-1">${displayData[0]?.open.toFixed(2) || '0.00'}</p>
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

      {/* Gráfico candlestick personalizado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Precio (USD) - Gráfico de Velas</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Zoom:</span>
            <input
              type="range"
              min="10"
              max="100"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-24 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-emerald-400 font-semibold w-8">{candlesToShow}</span>
          </div>
        </div>

        <div className="w-full h-96 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 60, bottom: 30 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee22" />
                  <stop offset="100%" stopColor="#22d3ee05" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#334155"
                opacity={0.2}
                horizontal={true}
                vertical={true}
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
              />

              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'Precio (USD)', angle: -90, position: 'insideLeft' }}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }} />

              {/* Velas candlestick personalizadas */}
              <Bar
                dataKey="close"
                shape={<CandleStickShape />}
                isAnimationActive={false}
              />

              {/* Línea de promedio móvil SMA20 */}
              {indicators?.sma20 && indicators.sma20.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="SMA(20)"
                />
              )}

              {/* Línea de promedio móvil EMA12 */}
              {indicators?.ema12 && indicators.ema12.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="ema12"
                  stroke="#fb923c"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                  name="EMA(12)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

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

      {/* Volumen separado */}
      {showVolume && displayData.length > 0 && (
        <div className="space-y-2 border-t border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Volumen de Operaciones</h3>
          <div className="w-full h-32 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 30, left: 60, bottom: 20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '11px' }} tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '11px' }} tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #64748b',
                    borderRadius: '6px'
                  }}
                  formatter={(value: any) => `${(value / 1e6).toFixed(2)}M`}
                />
                <Bar
                  dataKey="volume"
                  fill="#22d3ee"
                  opacity={0.7}
                  isAnimationActive={false}
                >
                  {displayData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.close >= entry.open ? '#10b98122' : '#ef444422'}
                    />
                  ))}
                </Bar>
              </ComposedChart>
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
  // Mostrar últimos 50 valores
  const displayData = useMemo(() => {
    const lastData = data.slice(-50);
    return lastData.map((rsi, index) => ({
      index: index + 1,
      rsi: rsi ? parseFloat(rsi.toFixed(2)) : null,
      time: format(new Date(Date.now() - (50 - index) * 60000), 'HH:mm'),
    }));
  }, [data]);

  const currentRSI = displayData[displayData.length - 1]?.rsi || 0;

  const getStatus = (rsi: number) => {
    if (rsi > 70) return { text: 'Sobrecomprado', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/50' };
    if (rsi < 30) return { text: 'Sobrevendido', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/50' };
    if (rsi > 50) return { text: 'Alcista', color: 'text-emerald-400', bg: 'bg-emerald-900/10', border: 'border-emerald-500/30' };
    return { text: 'Bajista', color: 'text-red-400', bg: 'bg-red-900/10', border: 'border-red-500/30' };
  };

  const status = getStatus(currentRSI);

  const CustomRSITooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const stat = getStatus(value);

      return (
        <div className={`${stat.bg} border ${stat.border} p-3 rounded-lg text-xs shadow-2xl`}>
          <p className={`font-bold text-sm ${stat.color}`}>{value?.toFixed(2) || '0'}</p>
          <p className="text-slate-400 mt-1">{stat.text}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">RSI (14)</h3>
          <p className="text-xs text-slate-500 mt-1">Índice de Fuerza Relativa</p>
        </div>
        <div className={`text-right px-4 py-2 rounded-lg ${status.bg} border ${status.border}`}>
          <p className={`text-2xl font-bold ${status.color}`}>{currentRSI.toFixed(2)}</p>
          <p className={`text-xs font-semibold ${status.color} uppercase tracking-wider`}>{status.text}</p>
        </div>
      </div>

      {/* Estadísticas de RSI */}
      <div className="grid grid-cols-3 gap-3 text-xs bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Máximo</p>
          <p className="text-cyan-300 font-bold text-sm mt-1">{Math.max(...displayData.map(d => d.rsi || 0)).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Mínimo</p>
          <p className="text-orange-300 font-bold text-sm mt-1">{Math.min(...displayData.map(d => d.rsi || 0)).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-slate-500 uppercase tracking-wider">Promedio</p>
          <p className="text-blue-300 font-bold text-sm mt-1">
            {(displayData.reduce((sum, d) => sum + (d.rsi || 0), 0) / displayData.length).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráfico RSI */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Evolución RSI</h4>
        <div className="w-full h-80 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 20, right: 30, left: 60, bottom: 30 }}>
              <defs>
                <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#334155"
                opacity={0.2}
                horizontal={true}
                vertical={true}
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
              />

              <YAxis
                domain={[0, 100]}
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tick={{ fill: '#94a3b8' }}
                label={{ value: 'RSI', angle: -90, position: 'insideLeft' }}
              />

              <Tooltip content={<CustomRSITooltip />} cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }} />

              {/* Zona de sobrecompra (70) */}
              <ReferenceLine
                y={70}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: '70 - Sobrecomprado',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 11,
                  offset: 10,
                }}
              />

              {/* Zona de sobreventa (30) */}
              <ReferenceLine
                y={30}
                stroke="#10b981"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: '30 - Sobrevendido',
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 11,
                  offset: 10,
                }}
              />

              {/* Línea de equilibrio (50) */}
              <ReferenceLine
                y={50}
                stroke="#64748b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              {/* Línea RSI */}
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda de zonas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 font-bold text-sm">Sobrecomprado</p>
            <p className="text-slate-400 text-xs mt-1">RSI {'>'} 70</p>
            <p className="text-slate-500 text-xs mt-1">Posible reversa bajista</p>
          </div>
          <div className="p-3 bg-emerald-900/20 border border-emerald-500/50 rounded-lg">
            <p className="text-emerald-400 font-bold text-sm">Sobrevendido</p>
            <p className="text-slate-400 text-xs mt-1">RSI {'<'} 30</p>
            <p className="text-slate-500 text-xs mt-1">Posible reversa alcista</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para renderizar velas candlestick reales
// Compara con la vela anterior y empieza desde el centro
function CandleStickShape(props: any) {
  const { x, y, width, height, payload, index, data } = props;

  if (!payload) return null;

  const { close, open, high, low } = payload;

  // Si no hay datos válidos, no renderizar
  if (open === undefined || close === undefined || high === undefined || low === undefined) {
    return null;
  }

  // Obtener la vela anterior para comparación
  let previousClose = open;
  if (index && index > 0 && data && data[index - 1]) {
    previousClose = data[index - 1].close;
  }

  // Calcular la posición en el eje Y
  const yAxis = props.yAxis;
  if (!yAxis) return null;

  const yScale = yAxis.scale;
  if (!yScale || typeof yScale !== 'function') return null;

  try {
    // Obtener posiciones Y
    const openY = yScale(previousClose); // La vela empieza donde terminó la anterior
    const closeY = yScale(close);
    const highY = yScale(high);
    const lowY = yScale(low);

    // Validar que sean números
    if (!isFinite(openY) || !isFinite(closeY) || !isFinite(highY) || !isFinite(lowY)) {
      return null;
    }

    // Determinar color basado en comparación con anterior
    const isGreen = close >= previousClose;
    const bodyColor = isGreen ? '#10b981' : '#ef4444';
    const wickColor = isGreen ? '#059669' : '#dc2626';

    // Dimensiones
    const candleWidth = Math.max(width * 0.6, 3);
    const wickWidth = Math.max(width * 0.1, 1);
    const centerX = x + width / 2;

    return (
      <g>
        {/* Mecha (high-low line) */}
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={lowY}
          stroke={wickColor}
          strokeWidth={wickWidth}
          strokeLinecap="round"
        />
        {/* Cuerpo de la vela */}
        <rect
          x={centerX - candleWidth / 2}
          y={Math.min(openY, closeY)}
          width={candleWidth}
          height={Math.abs(closeY - openY) || 2}
          fill={bodyColor}
          stroke={bodyColor}
          strokeWidth={1}
          rx={2}
        />
      </g>
    );
  } catch (error) {
    return null;
  }
}
