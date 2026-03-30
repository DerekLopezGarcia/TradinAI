'use client';

import React, { useState } from 'react';
import { useMarketData } from '@/app/hooks/useMarketData';
import { AutoAnalysisDisplay } from '@/components/AutoAnalysisDisplay';
import { TimeFrame } from '@/lib/types';

/**
 * Página de ejemplo que muestra análisis automático
 * Recoge los datos de velas automáticamente y muestra el análisis con explicaciones
 */
export default function PaginaAnalisisAutomatico() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1h');

  // Hook que recoge datos automáticamente
  const { data: candleData, loading: dataLoading, error: dataError } = useMarketData(
    symbol,
    timeframe
  );

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            📊 Análisis Automático de Velas
          </h1>
          <p className="text-muted-foreground">
            El sistema recoge automáticamente los datos y te explica el análisis en detalle
          </p>
        </div>

        {/* Controles */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Símbolo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Símbolo
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                disabled={dataLoading}
              >
                <option value="BTCUSDT">Bitcoin (BTCUSDT)</option>
                <option value="ETHUSDT">Ethereum (ETHUSDT)</option>
                <option value="BNBUSDT">Binance Coin (BNBUSDT)</option>
                <option value="XRPUSDT">Ripple (XRPUSDT)</option>
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
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                disabled={dataLoading}
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

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Estado
              </label>
              <div className="rounded border border-border bg-background px-3 py-2 flex items-center gap-2">
                {dataLoading ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    <span className="text-muted-foreground">Cargando...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-muted-foreground">
                      {candleData.length} velas
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Errores */}
        {dataError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">❌ {dataError}</p>
          </div>
        )}

        {/* Análisis Automático */}
        {candleData.length >= 20 ? (
          <AutoAnalysisDisplay
            symbol={symbol}
            timeframe={timeframe}
            candleData={candleData}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {dataLoading
                ? 'Cargando datos...'
                : 'Se necesitan al menos 20 velas para realizar el análisis'}
            </p>
          </div>
        )}

        {/* Información Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <InfoCard
            icon="🔄"
            title="Actualización Automática"
            description="El análisis se actualiza automáticamente cada vez que hay nuevos datos de velas"
          />
          <InfoCard
            icon="🎯"
            title="Explicaciones Detalladas"
            description="Cada predicción incluye el razonamiento completo: tendencias, patrones, indicadores"
          />
          <InfoCard
            icon="⚠️"
            title="Advertencias"
            description="Se identifican automáticamente los factores de riesgo y condiciones extremas"
          />
        </div>

        {/* Guía de Uso */}
        <div className="rounded-lg border border-border bg-card p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">📖 Cómo Funciona</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>1. Recolección Automática:</strong> El sistema se conecta a
              la API de Binance y recoge automáticamente los datos de velas del
              símbolo y temporalidad seleccionados.
            </p>
            <p>
              <strong>2. Análisis Completo:</strong> Se ejecuta un análisis
              profesional que incluye:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Identificación de 50+ patrones de velas</li>
              <li>Cálculo de tendencia (estructura, MAs, ADX)</li>
              <li>Análisis de 9 indicadores técnicos</li>
              <li>Generación de predicciones probabilísticas</li>
              <li>Identificación de niveles clave</li>
            </ul>
            <p>
              <strong>3. Explicación Detallada:</strong> Por cada sección del
              análisis, el sistema te explica:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>Por qué</strong> llegó a esa conclusión
              </li>
              <li>
                <strong>En qué se basó</strong> (tendencias, patrones,
                indicadores)
              </li>
              <li>
                <strong>Qué significado</strong> tiene para el trading
              </li>
            </ul>
            <p>
              <strong>4. Predicción Accionable:</strong> Recibe objetivos de
              precio, stops, relación R/R y múltiples escenarios.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

interface InfoCardProps {
  icon: string;
  title: string;
  description: string;
}

function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-2xl mb-2">{icon}</p>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

