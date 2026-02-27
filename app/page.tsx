'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/lib/store';
import { Header, TimeFrameSelector } from '@/components/Header';
import { PriceChart, RSIChart } from '@/components/Charts';
import { ChatPanel, AnalysisCard } from '@/components/AIChat';
import { NewsFeed } from '@/components/NewsFeed';
import { AlertManager } from '@/components/AlertManager';
import { useMarketData } from '@/app/hooks/useMarketData';
import { calculateSMA, calculateEMA, calculateRSI } from '@/lib/indicators';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
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
  const { data, loading, error: dataError } = useMarketData(
    selectedAsset?.symbol || 'BTCUSD',
    selectedTimeframe
  );

  // Manejo de errores de datos
  useEffect(() => {
    if (dataError) {
      setError(dataError);
      toast.error(`Error: ${dataError}`);
    }
  }, [dataError]);

  // Memoizar cálculo de indicadores con validación
  const { sma20, ema12, rsi } = useMemo(() => {
    if (!data || data.length === 0) {
      return { sma20: [], ema12: [], rsi: [] };
    }

    try {
      const closePrices = data.map(d => d.close).filter(p => !isNaN(p) && isFinite(p));

      if (closePrices.length < 14) {
        return { sma20: [], ema12: [], rsi: [] };
      }

      return {
        sma20: calculateSMA(closePrices, 20),
        ema12: calculateEMA(closePrices, 12),
        rsi: calculateRSI(closePrices, 14),
      };
    } catch (err) {
      console.error('Error calculating indicators:', err);
      return { sma20: [], ema12: [], rsi: [] };
    }
  }, [data]);

  // Actualización de precios más eficiente
  const priceUpdateInterval = useCallback(() => {
    if (!selectedAsset) return;

    const interval = setInterval(() => {
      try {
        useMarketStore.setState((state) => {
          if (!state.selectedAsset) return state;

          const change = (Math.random() - 0.5) * (selectedAsset.price * 0.001);
          const newPrice = Math.max(selectedAsset.price + change, 0.01);
          const changePercent = ((change / selectedAsset.price) * 100);

          return {
            selectedAsset: {
              ...state.selectedAsset,
              price: parseFloat(newPrice.toFixed(2)),
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
            },
          };
        });
      } catch (err) {
        console.error('Error updating price:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedAsset]);

  useEffect(() => {
    return priceUpdateInterval();
  }, [priceUpdateInterval]);

  if (!selectedAsset) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">Inicializando TradingIA...</p>
        </div>
      </div>
    );
  }

  const favoriteAssets = assets.filter(a => a.isFavorite);
  const isPositive = selectedAsset.changePercent >= 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--muted))',
          },
        }}
      />

      {/* Header */}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative w-64 bg-card border-r border-muted/30 transition-all duration-300 z-40 lg:z-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } h-full overflow-y-auto`}
        >
          <div className="p-6 space-y-8">
            {/* Botón cerrar en móvil */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 hover:bg-muted/20 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Información del activo seleccionado */}
            <div className="mt-6 lg:mt-0 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">ACTIVO ACTUAL</p>
              <p className="text-2xl font-bold mb-2">{selectedAsset.symbol}</p>
              <p className="text-sm text-muted-foreground mb-3">{selectedAsset.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold">${selectedAsset.price.toFixed(2)}</p>
                <p
                  className={`text-sm font-semibold flex items-center gap-1 ${
                    isPositive ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Favoritos */}
            {favoriteAssets.length > 0 && (
              <>
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase text-muted-foreground tracking-wider">
                    ⭐ Favoritos ({favoriteAssets.length})
                  </h3>
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
                            ? 'bg-primary/20 border border-primary/50'
                            : 'hover:bg-muted/20 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{asset.symbol}</p>
                          <p
                            className={`text-xs font-bold ${
                              asset.changePercent >= 0 ? 'text-primary' : 'text-secondary'
                            }`}
                          >
                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">${asset.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Todos los activos */}
            <div>
              <h3 className="font-bold text-sm mb-3 uppercase text-muted-foreground tracking-wider">
                📊 Todos los Activos
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedAsset.id === asset.id
                        ? 'bg-primary/20 border border-primary/50'
                        : 'hover:bg-muted/20 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{asset.symbol}</span>
                      <span
                        className={`text-xs font-bold ${
                          asset.changePercent >= 0 ? 'text-primary' : 'text-secondary'
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

        {/* Overlay para cerrar sidebar en móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
            {/* Error banner */}
            {error && (
              <div className="bg-secondary/10 border border-secondary/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-secondary">Error de carga</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="p-2 hover:bg-secondary/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Selector de timeframe */}
            <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm -mx-4 md:-mx-6 px-4 md:px-6 py-4 z-20">
              <div>
                <h2 className="text-xl font-bold">Análisis Técnico</h2>
                <p className="text-sm text-muted-foreground">{selectedAsset.symbol} • {selectedAsset.name}</p>
              </div>
              <TimeFrameSelector
                selectedTimeframe={selectedTimeframe}
                onSelect={setSelectedTimeframe}
              />
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de precios (columna izquierda) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Price Chart */}
                {loading ? (
                  <div className="card-glass h-96 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando gráfico...</p>
                    </div>
                  </div>
                ) : data.length > 0 ? (
                  <div className="card-glass rounded-xl overflow-hidden">
                    <PriceChart
                      data={data}
                      symbol={selectedAsset.symbol}
                      showVolume={true}
                      indicators={{ sma20, ema12 }}
                    />
                  </div>
                ) : (
                  <div className="card-glass h-96 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <p className="text-muted-foreground">Sin datos disponibles</p>
                    </div>
                  </div>
                )}

                {/* RSI Chart */}
                {rsi.length > 0 && (
                  <div className="card-glass rounded-xl overflow-hidden">
                    <RSIChart data={rsi} />
                  </div>
                )}

                {/* Análisis de IA */}
                <div className="card-glass rounded-xl overflow-hidden">
                  <AnalysisCard
                    symbol={selectedAsset.symbol}
                    timeframe={selectedTimeframe}
                  />
                </div>
              </div>

              {/* Sidebar derecho */}
              <div className="space-y-6">
                {/* Chat con IA */}
                <div className="card-glass rounded-xl overflow-hidden">
                  <ChatPanel
                    symbol={selectedAsset.symbol}
                    timeframe={selectedTimeframe}
                  />
                </div>

                {/* Noticias */}
                <div className="card-glass rounded-xl overflow-hidden">
                  <NewsFeed symbol={selectedAsset.symbol} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Alert Manager */}
      <AlertManager />
    </div>
  );
}

