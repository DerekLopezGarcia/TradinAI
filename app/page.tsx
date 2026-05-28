'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { useWidgetStore } from '@/lib/widgetStore';
import { Header } from '@/components/Header';
import { NavBar } from '@/components/NavBar';
import { Sidebar } from '@/components/Sidebar';
import { WidgetsPanel } from '@/components/WidgetsPanel';
import { DashboardGrid } from '@/components/DashboardGrid';
import { X, Zap } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  const { selectedAsset, selectedTimeframe, updateAssetPrice } = useMarketStore();
  const { editMode } = useWidgetStore();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!selectedAsset || !selectedAsset.symbol) return;
    const loadRealPrice = async () => {
      try {
        const params = new URLSearchParams({ symbol: selectedAsset.symbol, type: 'price' });
        const res = await fetch(`/api/market?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.price && !isNaN(data.price)) {
          updateAssetPrice(
            selectedAsset.symbol,
            parseFloat(data.price),
            parseFloat(data.change ?? 0),
            parseFloat(data.changePercent ?? 0)
          );
        }
      } catch (err) {
        console.error('Error loading real price:', err);
      }
    };
    loadRealPrice();
  }, [selectedAsset?.symbol, updateAssetPrice]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);

  if (!selectedAsset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-primary text-lg font-semibold">Inicializando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300" suppressHydrationWarning>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          },
        }}
      />
      <Sidebar />
      <Header />
      <NavBar
        selectedType={null}
        onTypeChange={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <WidgetsPanel />

      <main
        className={`p-4 md:p-6 space-y-6 transition-all duration-300 ease-out ${
          editMode ? 'ml-[270px]' : 'ml-0'
        }`}
      >
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-destructive/20 rounded-lg">
              <X className="w-5 h-5 text-destructive" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {selectedAsset.symbol} · ${selectedAsset.price.toFixed(2)}&nbsp;
              <span className={selectedAsset.changePercent >= 0 ? 'price-up' : 'price-down'}>
                {selectedAsset.changePercent >= 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>

        <DashboardGrid
          symbol={selectedAsset.symbol}
          timeframe={selectedTimeframe}
        />
      </main>
    </div>
  );
}
