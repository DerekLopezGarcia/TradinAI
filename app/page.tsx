'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMarketStore } from '@/lib/store';
import { Header, TimeFrameSelector } from '@/components/Header';
import { PriceChart, RSIChart } from '@/components/Charts';
import { ChatPanel, AnalysisCard } from '@/components/AIChat';
import { NewsFeed } from '@/components/NewsFeed';
import { AlertManager } from '@/components/AlertManager';
import { useMarketData } from '@/app/hooks/useMarketData';
import { calculateSMA, calculateEMA, calculateRSI } from '@/lib/indicators';
import { Menu, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const {
    selectedAsset,
    setSelectedAsset,
    selectedTimeframe,
    setSelectedTimeframe,
    assets,
    favorites,
  } = useMarketStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data, loading } = useMarketData(selectedAsset?.symbol || 'BTCUSD', selectedTimeframe);

  // Memoizar cálculo de indicadores para evitar recalcular en cada render
  const { sma20, ema12, rsi } = useMemo(() => {
    if (data.length === 0) return { sma20: [], ema12: [], rsi: [] };

    const closePrices = data.map(d => d.close);
    return {
      sma20: calculateSMA(closePrices, 20),
      ema12: calculateEMA(closePrices, 12),
      rsi: calculateRSI(closePrices, 14),
    };
  }, [data]);

  // Simular actualización de precios
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedAsset && Math.random() > 0.7) {
        const change = (Math.random() - 0.5) * 100;
        const newPrice = Math.max(selectedAsset.price + change, 0.01); // Evitar precios negativos
        const changePercent = ((change / selectedAsset.price) * 100);

        useMarketStore.setState((state) => ({
          selectedAsset: state.selectedAsset ? {
            ...state.selectedAsset,
            price: newPrice,
            change: change,
            changePercent: changePercent,
          } : null,
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Dependencias vacías - se ejecuta solo una vez

  if (!selectedAsset) return null;

  const favoriteAssets = assets.filter(a => a.isFavorite);

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

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative w-64 bg-card border-r border-muted/30 transition-transform duration-300 z-40 lg:z-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } max-h-[calc(100vh-80px)] overflow-y-auto`}
        >
          <div className="p-6">
            {/* Cerrar sidebar en móvil */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute top-4 right-4 p-2 hover:bg-muted/20 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Favoritos */}
            <h3 className="font-bold text-sm mb-4 uppercase text-muted-foreground tracking-wider">
              Favoritos
            </h3>
            <div className="space-y-2 mb-6">
              {favoriteAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedAsset.id === asset.id
                      ? 'bg-primary/30 border border-primary'
                      : 'hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{asset.symbol}</p>
                      <p className="text-xs text-muted-foreground">${asset.price.toFixed(2)}</p>
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        asset.changePercent >= 0 ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Todos los activos */}
            <h3 className="font-bold text-sm mb-4 uppercase text-muted-foreground tracking-wider">
              Todos los Activos
            </h3>
            <div className="space-y-2">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedAsset.id === asset.id
                      ? 'bg-primary/30 border border-primary'
                      : 'hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{asset.symbol}</span>
                    <span
                      className={`font-semibold ${
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
        </aside>

        {/* Overlay para cerrar sidebar en móvil */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="space-y-6">
            {/* Selector de timeframe */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Análisis Técnico</h2>
              <TimeFrameSelector
                selectedTimeframe={selectedTimeframe}
                onSelect={setSelectedTimeframe}
              />
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de precios (columna izquierda, ocupa 2 columnas) */}
              <div className="lg:col-span-2 space-y-6">
                {loading ? (
                  <div className="card-glass h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando datos del gráfico...</p>
                    </div>
                  </div>
                ) : (
                  <PriceChart
                    data={data}
                    symbol={selectedAsset.symbol}
                    showVolume={true}
                    indicators={{ sma20, ema12 }}
                  />
                )}

                {/* RSI */}
                <RSIChart data={rsi} />

                {/* Análisis de IA */}
                <AnalysisCard
                  symbol={selectedAsset.symbol}
                  timeframe={selectedTimeframe}
                />
              </div>

              {/* Sidebar derecho */}
              <div className="space-y-6">
                {/* Chat con IA */}
                <ChatPanel
                  symbol={selectedAsset.symbol}
                  timeframe={selectedTimeframe}
                />

                {/* Noticias */}
                <NewsFeed symbol={selectedAsset.symbol} />
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

