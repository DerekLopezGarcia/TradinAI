'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { Header, TimeFrameSelector } from '@/components/Header';
import { NavBar } from '@/components/NavBar';
import { TradingViewChart } from '@/components/TradingViewChart';
import { ChatPanel, AnalysisCard } from '@/components/AIChat';
import { NewsFeed } from '@/components/NewsFeed';
import { AlertManager } from '@/components/AlertManager';
import { Tooltip, IndicatorLegend } from '@/components/IndicatorTooltip';
import { useMarketData } from '@/app/hooks/useMarketData';
import {X, TrendingUp, TrendingDown, Zap, Eye, EyeOff} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const {
    selectedAsset,
    setSelectedAsset,
    selectedTimeframe,
    setSelectedTimeframe,
    assets,
  } = useMarketStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<{ sma: number | null; ema: number | null; rsi: number | null; adx: number | null; stochasticK: number | null; stochasticD: number | null }>({ sma: null, ema: null, rsi: null, adx: null, stochasticK: null, stochasticD: null });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBollinger, setShowBollinger] = useState(false);

  const { data, loading, error: dataError, isFallback } = useMarketData(
    selectedAsset?.symbol || 'BTCUSD',
    selectedTimeframe
  );

  useEffect(() => {
    if (dataError) {
      setError(dataError);
      setTimeout(() => toast.error(`Error: ${dataError}`), 100);
    }
  }, [dataError]);

  // Actualizar precio en tiempo real cada 30s para TODOS los activos
  useEffect(() => {
    const updateAllPrices = async () => {
      const store = useMarketStore.getState();
      const symbols = store.assets.map(a => a.symbol);

      const updatePromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(
            `/api/market?symbol=${symbol}&type=price&t=${Date.now()}`
          );
          if (!response.ok) return;
          const priceData = await response.json();
          if (!priceData.price || isNaN(priceData.price)) return;

          store.updateAssetPrice(
            symbol,
            priceData.price,
            priceData.change ?? 0,
            priceData.changePercent ?? 0,
          );
        } catch (err) {
          console.error(`Error updating price for ${symbol}:`, err);
        }
      });

      await Promise.allSettled(updatePromises);
    };

    // Primera llamada inmediata
    updateAllPrices();

    // Luego cada 30 segundos
    const timer = setInterval(updateAllPrices, 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!selectedAsset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-cyan-400 text-lg font-semibold">Inicializando...</p>
        </div>
      </div>
    );
  }

  const favoriteAssets = assets.filter(a => a.isFavorite);
  const isPositive = selectedAsset.changePercent >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" suppressHydrationWarning>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#00f0ff',
            border: '1px solid #00f0ff',
            borderRadius: '8px',
          },
        }}
      />

      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <NavBar
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex h-[calc(100vh-240px)]">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative w-72 bg-gradient-to-b from-slate-900 to-slate-950 border-r border-cyan-500/20 transition-all duration-300 z-40 lg:z-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } h-full overflow-y-auto`}
        >
          <div className="p-6 space-y-6">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 hover:bg-cyan-500/10 rounded-lg"
            >
              <X className="w-5 h-5 text-cyan-400" />
            </button>

            <div className="mt-6 lg:mt-0 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/30">
              <p className="text-xs text-cyan-400 mb-2 uppercase font-semibold">Actual</p>
              <p className="text-2xl font-bold text-white mb-2">{selectedAsset.symbol}</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-cyan-300">${selectedAsset.price.toFixed(2)}</p>
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {favoriteAssets.length > 0 && (
              <div>
                <h3 className="font-bold text-sm mb-3 uppercase text-cyan-400">⭐ Favoritos</h3>
                <div className="space-y-2">
                  {favoriteAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                        selectedAsset.id === asset.id
                          ? 'bg-cyan-500/20 border border-cyan-400'
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm text-white">{asset.symbol}</p>
                        <p
                          className={`text-xs font-bold ${
                            asset.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">${asset.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-bold text-sm mb-3 uppercase text-cyan-400">📊 Activos</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assets
                  .filter(asset => {
                    const matchesType = !selectedType || asset.type === selectedType;
                    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                         asset.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesType && matchesSearch;
                  })
                  .map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      selectedAsset.id === asset.id
                        ? 'bg-cyan-500/20 border border-cyan-400'
                        : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{asset.symbol}</span>
                      <span
                        className={`text-xs font-bold ${
                          asset.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="font-semibold text-red-400">Error</p>
                    <p className="text-sm text-red-300/80">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-2 hover:bg-red-500/20 rounded-lg"
                >
                  <X className="w-5 h-5 text-red-400" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between sticky top-0 bg-gradient-to-r from-slate-950/80 to-slate-900/80 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-4 z-20 border-b border-cyan-500/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Análisis</h2>
                <p className="text-sm text-slate-400">{selectedAsset.symbol}</p>
              </div>
              <TimeFrameSelector
                selectedTimeframe={selectedTimeframe}
                onSelect={setSelectedTimeframe}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {loading ? (
                  <div className="h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400">Cargando...</p>
                    </div>
                  </div>
                ) : data.length > 0 ? (
                  <TradingViewChart
                    data={data}
                    symbol={selectedAsset.symbol}
                    interval={selectedTimeframe}
                    showVolume={true}
                    showRSI={true}
                    showBollinger={showBollinger}
                    isFallback={isFallback}
                    onIndicatorsUpdate={setIndicators}
                  />
                ) : (
                  <div className="h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 flex items-center justify-center">
                    <p className="text-slate-400">Sin datos</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden">
                  <AnalysisCard
                    symbol={selectedAsset.symbol}
                    timeframe={selectedTimeframe}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {/* Tarjeta de Indicadores Técnicos */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-3">Indicadores</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Media Móvil Simple (20 períodos). Promedio de precios. Indica tendencia general.">
                        <span className="text-xs text-slate-400">SMA(20)</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold text-white">
                        {indicators.sma !== null ? indicators.sma.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Media Móvil Exponencial (20 períodos). Da más peso a precios recientes. Más reactiva que SMA.">
                        <span className="text-xs text-slate-400">EMA(20)</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold text-white">
                        {indicators.ema !== null ? indicators.ema.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Índice de Fuerza Relativa (14 períodos). Mide momentum. 🟢 Verde <30 (sobreventa), 🔵 Azul 30-70 (neutral), 🔴 Rojo >70 (sobrecompra).">
                        <span className="text-xs text-slate-400">RSI(14)</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold" style={{
                        color: indicators.rsi === null ? '#9ca3af'
                          : indicators.rsi >= 70 ? '#ef5350'
                          : indicators.rsi <= 30 ? '#26a69a'
                          : '#818cf8'
                      }}>
                        {indicators.rsi !== null ? indicators.rsi.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Índice Direccional Promedio (14 períodos). Mide fuerza de tendencia (0-100). 🔘 Gris <20 (sin), 🔵 Azul 20-25 (débil), 🟡 Amarillo 25-40 (fuerte), 🔴 Rojo >40 (muy fuerte).">
                        <span className="text-xs text-slate-400">ADX(14)</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold" style={{
                        color: indicators.adx === null ? '#9ca3af'
                          : indicators.adx >= 40 ? '#ef5350'
                          : indicators.adx >= 25 ? '#fbbf24'
                          : indicators.adx >= 20 ? '#60a5fa'
                          : '#9ca3af'
                      }}>
                        {indicators.adx !== null ? indicators.adx.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Estocástico Rápido (%K). Línea sensible que reacciona rápido. 🟢 Verde <20 (sobreventa), 🔴 Rojo >80 (sobrecompra). Busca cruces con %D.">
                        <span className="text-xs text-slate-400">Stoch %K</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold" style={{
                        color: indicators.stochasticK === null ? '#9ca3af'
                          : indicators.stochasticK >= 80 ? '#ef5350'
                          : indicators.stochasticK <= 20 ? '#26a69a'
                          : '#818cf8'
                      }}>
                        {indicators.stochasticK !== null ? indicators.stochasticK.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Estocástico Lento (%D). Media móvil de %K. Confirma señales. Busca cruces: %K arriba = compra, %K abajo = venta.">
                        <span className="text-xs text-slate-400">Stoch %D</span>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold" style={{
                        color: indicators.stochasticD === null ? '#9ca3af'
                          : indicators.stochasticD >= 80 ? '#ef5350'
                          : indicators.stochasticD <= 20 ? '#26a69a'
                          : '#818cf8'
                      }}>
                        {indicators.stochasticD !== null ? indicators.stochasticD.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-900/40 rounded">
                      <Tooltip content="Bandas de Bollinger (20, 2). Muestra volatilidad en el gráfico. Precio en banda superior = sobrecompra, en banda inferior = sobreventa.">
                        <button 
                          onClick={() => setShowBollinger(!showBollinger)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            showBollinger 
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                              : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {showBollinger ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}
                          Bollinger
                        </button>
                      </Tooltip>
                      <span className="text-sm font-mono font-bold text-cyan-300">
                        {showBollinger ? '✓' : '◯'}
                      </span>
                    </div>
                  </div>
                </div>

                <IndicatorLegend isOpen={false} />

                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden">
                  <ChatPanel
                    symbol={selectedAsset.symbol}
                    timeframe={selectedTimeframe}
                  />
                </div>

                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden">
                  <NewsFeed symbol={selectedAsset.symbol} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AlertManager />
    </div>
  );
}


