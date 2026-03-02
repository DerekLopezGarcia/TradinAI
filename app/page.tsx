'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useMarketStore } from '@/lib/store';
import { Header, TimeFrameSelector } from '@/components/Header';
import { TradingViewChart } from '@/components/TradingViewChart';
import { RSIChart } from '@/components/Charts';
import { ChatPanel, AnalysisCard } from '@/components/AIChat';
import { NewsFeed } from '@/components/NewsFeed';
import { AlertManager } from '@/components/AlertManager';
import { useMarketData } from '@/app/hooks/useMarketData';
import { calculateSMA, calculateEMA, calculateRSI } from '@/lib/indicators';
import { X, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {CandleData} from "@/lib/types.ts";

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
  const indicatorsRef = useRef<{ sma20: number[]; ema12: number[]; rsi: number[] }>({
    sma20: [],
    ema12: [],
    rsi: [],
  });

  const { data, loading, error: dataError } = useMarketData(
    selectedAsset?.symbol || 'BTCUSD',
    selectedTimeframe
  );

  useEffect(() => {
    if (dataError) {
      setError(dataError);
      setTimeout(() => toast.error(`Error: ${dataError}`), 100);
    }
  }, [dataError]);

  useEffect(() => {
    if (!data || data.length === 0) {
      indicatorsRef.current = { sma20: [], ema12: [], rsi: [] };
      return;
    }

    const calculateAsync = async () => {
      try {
        const closePrices = data
          .map((d: CandleData) => d.close)
          .filter((p: number) => !isNaN(p) && isFinite(p));

        if (closePrices.length < 14) {
          indicatorsRef.current = { sma20: [], ema12: [], rsi: [] };
          return;
        }

        await new Promise(resolve => {
          requestAnimationFrame(() => {
            indicatorsRef.current = {
              sma20: calculateSMA(closePrices, 20),
              ema12: calculateEMA(closePrices, 12),
              rsi: calculateRSI(closePrices, 14),
            };
            resolve(null);
          });
        });
      } catch (err) {
        console.error('Error calculating indicators:', err);
        indicatorsRef.current = { sma20: [], ema12: [], rsi: [] };
      }
    };

    calculateAsync();
  }, [data]);

  const indicators = useMemo(() => indicatorsRef.current, [data]);

  // Actualizar precio desde API - DATOS REALES sin simulación
  useEffect(() => {
    if (!selectedAsset?.symbol) return;

    const updatePrice = async () => {
      try {
        const response = await fetch(
          `/api/market?symbol=${selectedAsset.symbol}&type=price`
        );
        if (response.ok) {
          const priceData = await response.json();
          useMarketStore.setState((state) => ({
            selectedAsset: state.selectedAsset
              ? {
                  ...state.selectedAsset,
                  price: priceData.price || state.selectedAsset.price,
                  change: priceData.change || 0,
                  changePercent: priceData.changePercent || 0,
                }
              : null,
          }));
        }
      } catch (err) {
        console.error('Error updating price:', err);
      }
    };

    // Actualizar inmediatamente y luego cada 10 segundos
    updatePrice();
    const interval = setInterval(updatePrice, 10000);

    return () => clearInterval(interval);
  }, [selectedAsset?.symbol]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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

      <div className="flex h-[calc(100vh-80px)]">
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
                {assets.map((asset) => (
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
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden p-6">
                    <TradingViewChart
                      data={data}
                      symbol={selectedAsset.symbol}
                      showVolume={true}
                      indicators={indicators}
                    />
                  </div>
                ) : (
                  <div className="h-96 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 flex items-center justify-center">
                    <p className="text-slate-400">Sin datos</p>
                  </div>
                )}

                {indicators.rsi.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-cyan-500/20 overflow-hidden">
                    <RSIChart data={indicators.rsi} />
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


