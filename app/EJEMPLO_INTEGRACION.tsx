/**
 * Integración del Analizador de Velas en la Página Principal
 * 
 * Este archivo muestra cómo integrar el componente CandleAnalysisPanel
 * en tu página principal para un análisis profesional de velas.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CandleAnalysisComponent } from '@/components/CandleAnalysisPanel';
import { CandleData, TimeFrame } from '@/lib/types';

export default function TradingAnalyticsPage() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1h');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para generar datos de ejemplo
  const generateSampleCandles = (count: number = 50): CandleData[] => {
    const candles: CandleData[] = [];
    let basePrice = 42000;
    let currentTime = Date.now() - (count * 3600000); // Comenzar hace N horas

    for (let i = 0; i < count; i++) {
      const volatility = (Math.random() - 0.5) * 400; // Variación ±200
      const open = basePrice + volatility;
      const close = open + (Math.random() - 0.5) * 300;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      const volume = Math.random() * 5000 + 500;

      candles.push({
        time: currentTime,
        open,
        high,
        low,
        close,
        volume
      });

      basePrice = close; // La vela siguiente parte del cierre anterior
      currentTime += 3600000; // Agregar 1 hora
    }

    return candles;
  };

  // Cargar datos de ejemplo al iniciar
  useEffect(() => {
    setCandleData(generateSampleCandles(50));
  }, []);

  // Función para cargar nuevos datos cuando cambia símbolo/timeframe
  const loadCandleData = async () => {
    setLoading(true);
    try {
      // Simulación - En producción conectarías con Binance, TradingView, etc.
      const newCandles = generateSampleCandles(100);
      setCandleData(newCandles);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            🚀 Análisis Profesional de Velas Japonesas
          </h1>
          <p className="text-muted-foreground">
            Sistema profesional de análisis técnico con patrones de velas, indicadores y predicciones probabilísticas
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Selector de Símbolo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Símbolo del Activo
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                disabled={loading}
              >
                <option value="BTCUSDT">Bitcoin (BTCUSDT)</option>
                <option value="ETHUSDT">Ethereum (ETHUSDT)</option>
                <option value="BNBUSDT">Binance Coin (BNBUSDT)</option>
                <option value="XRPUSDT">Ripple (XRPUSDT)</option>
                <option value="EURUSD">Euro USD (EURUSD)</option>
                <option value="GBPUSD">Libra USD (GBPUSD)</option>
              </select>
            </div>

            {/* Selector de Timeframe */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Temporalidad
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                disabled={loading}
              >
                <option value="1m">1 Minuto</option>
                <option value="5m">5 Minutos</option>
                <option value="15m">15 Minutos</option>
                <option value="1h">1 Hora</option>
                <option value="4h">4 Horas</option>
                <option value="1d">1 Día</option>
                <option value="1w">1 Semana</option>
              </select>
            </div>

            {/* Información */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Datos Cargados
              </label>
              <div className="rounded border border-border bg-background px-3 py-2">
                <p className="text-sm text-foreground font-mono">
                  {candleData.length} velas
                </p>
                <p className="text-xs text-muted-foreground">
                  {candleData.length > 0
                    ? `${(candleData.length * 3600 / 3600).toFixed(0)} horas`
                    : 'Sin datos'}
                </p>
              </div>
            </div>

            {/* Botón Cargar */}
            <div className="flex items-end">
              <button
                onClick={loadCandleData}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded px-4 py-2 font-medium transition-colors"
              >
                {loading ? 'Cargando...' : 'Cargar Datos'}
              </button>
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                📊 Análisis de Patrones
              </h3>
              <p className="text-sm text-muted-foreground">
                Identificación automática de 50+ patrones de velas japonesas incluyendo reversiones, continuaciones e indecisión.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                📈 Indicadores Técnicos
              </h3>
              <p className="text-sm text-muted-foreground">
                RSI, MACD, Bollinger Bands, Stochastic, ATR, ADX y más. Análisis multi-indicador profesional.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                🎯 Predicciones
              </h3>
              <p className="text-sm text-muted-foreground">
                Predicciones probabilísticas con múltiples escenarios, objetivos de precio, stops y relación R/R.
              </p>
            </div>
          </div>
        </div>

        {/* Componente Principal de Análisis */}
        {candleData.length > 0 ? (
          <CandleAnalysisComponent
            symbol={symbol}
            timeframe={timeframe}
            candles={candleData}
            onAnalysisComplete={(analysis) => {
              console.log('✅ Análisis completado para:', symbol);
              console.log('📊 Tendencia:', analysis.summary.trend);
              console.log('💹 Probabilidad:', analysis.mainPrediction.probability + '%');
              
              // Aquí puedes hacer algo con el análisis completo
              // Por ejemplo: guardar en base de datos, mostrar notificación, etc.
            }}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Cargando datos de velas...
            </p>
          </div>
        )}

        {/* Footer con Información */}
        <div className="rounded-lg border border-border bg-card p-6 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">📚 Documentación</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>📖 <a href="#" className="text-primary hover:underline">Guía Completa</a> - ANALISIS_VELAS_GUIA.md</li>
                <li>💻 <a href="#" className="text-primary hover:underline">Ejemplos de Uso</a> - EJEMPLOS_USO.ts</li>
                <li>📋 <a href="#" className="text-primary hover:underline">Resumen de Cambios</a> - RESUMEN_CAMBIOS.md</li>
                <li>🔧 <a href="#" className="text-primary hover:underline">README Actualizado</a> - README_ACTUALIZADO.md</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">⚠️ Información Importante</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Análisis técnico educativo</li>
                <li>✓ Probabilities, no certezas</li>
                <li>✓ Requiere gestión de riesgo</li>
                <li>✓ Mín. 20 velas para análisis confiable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Endpoint API Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-3">🔌 API REST</h3>
          <div className="bg-background rounded p-4 font-mono text-sm space-y-2">
            <div className="text-primary">POST /api/ai/analyze</div>
            <div className="text-muted-foreground">
              <p>Body:</p>
              <pre className="overflow-auto max-h-40 mt-2 p-2 bg-background rounded border border-border">
{`{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "analysisDepth": "comprehensive",
  "candles": [
    {
      "time": 1704067200000,
      "open": 42150.50,
      "high": 42300.00,
      "low": 42050.25,
      "close": 42280.75,
      "volume": 1250.5
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

