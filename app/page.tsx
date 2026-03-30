'use client';
import { useState, useEffect } from 'react';
import { useMarketStore } from '@/lib/store';
import { Header, TimeFrameSelector } from '@/components/Header';
import { NavBar } from '@/components/NavBar';
import { TradingViewChart } from '@/components/TradingViewChart';
import { ChatPanel } from '@/components/AIChat';
import { NewsFeed } from '@/components/NewsFeed';
import { AlertManager } from '@/components/AlertManager';
import { Tooltip, IndicatorLegend } from '@/components/IndicatorTooltip';
import { AutoAnalysisDisplay } from '@/components/AutoAnalysisDisplay';
import { useMarketData } from '@/app/hooks/useMarketData';
import { useScannerPriceRefresh } from '@/app/hooks/useScannerPriceRefresh';
import { X, Zap, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Home() {
  // Actualizar precio del activo seleccionado constantemente cada 3 segundos
  useScannerPriceRefresh();

  const { selectedAsset, selectedTimeframe, setSelectedTimeframe, updateAssetPrice } = useMarketStore();
  const [error, setError] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<{ sma: number | null; ema: number | null; rsi: number | null; adx: number | null; stochasticK: number | null; stochasticD: number | null }>({ sma: null, ema: null, rsi: null, adx: null, stochasticK: null, stochasticD: null });
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBollinger, setShowBollinger] = useState(false);
  const { data, loading, error: dataError, isFallback } = useMarketData(selectedAsset?.symbol || 'BTCUSD', selectedTimeframe);

  // Cargar precio real desde API cuando cambia el asset
  useEffect(() => {
    if (!selectedAsset || !selectedAsset.symbol) return;

    const loadRealPrice = async () => {
      try {
        // Usar API endpoint para obtener precio
        const params = new URLSearchParams({
          symbol: selectedAsset.symbol,
          type: 'price'
        });
        
        const res = await fetch(`/api/market?${params.toString()}`);
        if (!res.ok) {
          console.warn(`No se pudo obtener precio para ${selectedAsset.symbol}`);
          return;
        }
        
        const data = await res.json();
        if (data?.price && !isNaN(data.price)) {
          const price = parseFloat(data.price);
          const change = parseFloat(data.change ?? 0);
          const changePercent = parseFloat(data.changePercent ?? 0);
          
          // Actualizar el precio en el store con datos reales
          updateAssetPrice(selectedAsset.symbol, price, change, changePercent);
        }
      } catch (err) {
        console.error('Error loading real price:', err);
        // No mostrar error en toast, solo en consola
      }
    };

    loadRealPrice();
  }, [selectedAsset?.symbol, updateAssetPrice]);
  
  useEffect(() => {
    if (dataError) { setError(dataError); setTimeout(() => toast.error(`Error: ${dataError}`), 100); }
  }, [dataError]);

  // Mostrar contenido mientras carga - no bloquear UI
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
  
  const isPositive = selectedAsset.changePercent >= 0;
  return (
    <div className="min-h-screen bg-background transition-colors duration-300" suppressHydrationWarning>
      <Toaster position="top-right" toastOptions={{ style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: '8px' } }} />
      <Header onMenuClick={() => {}} />
      <NavBar selectedType={selectedType} onTypeChange={setSelectedType} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-destructive" />
              <div><p className="font-semibold text-destructive">Error</p><p className="text-sm text-destructive/80">{error}</p></div>
            </div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-destructive/20 rounded-lg"><X className="w-5 h-5 text-destructive" /></button>
          </div>
        )}

        {/* Barra de título + timeframes — SIN sticky */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Análisis</h2>
            <p className="text-sm text-muted-foreground">{selectedAsset.symbol} · ${selectedAsset.price.toFixed(2)}&nbsp;
              <span className={isPositive ? 'price-up' : 'price-down'}>
                {isPositive ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
              </span>
            </p>
          </div>
          <TimeFrameSelector selectedTimeframe={selectedTimeframe} onSelect={setSelectedTimeframe} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="h-96 bg-card rounded-xl border border-border flex items-center justify-center">
                <div className="text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-muted-foreground">Cargando...</p></div>
              </div>
            ) : data.length > 0 ? (
              <div className="space-y-3">
                <TradingViewChart data={data} symbol={selectedAsset.symbol} interval={selectedTimeframe} showVolume={true} showRSI={true} showBollinger={showBollinger} isFallback={isFallback} onIndicatorsUpdate={setIndicators} />
                

                {/* Análisis Automático de Velas */}
                {data.length >= 20 && (
                  <div className="bg-card rounded-lg border border-border p-6">
                    <AutoAnalysisDisplay
                      symbol={selectedAsset.symbol}
                      timeframe={selectedTimeframe}
                      candleData={data}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96 bg-card rounded-xl border border-border flex items-center justify-center"><p className="text-muted-foreground">Sin datos</p></div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border overflow-hidden p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Indicadores</h3>
              <div className="space-y-2">
                {[{ label: 'SMA(20)', value: indicators.sma, tooltip: 'Media Móvil Simple (20 períodos).' }, { label: 'EMA(20)', value: indicators.ema, tooltip: 'Media Móvil Exponencial (20 períodos).' }].map(({ label, value, tooltip }) => (
                  <div key={label} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <Tooltip content={tooltip}><span className="text-xs text-muted-foreground">{label}</span></Tooltip>
                    <span className="text-sm font-mono font-bold text-foreground">{value !== null ? value.toFixed(2) : '—'}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <Tooltip content="RSI(14). <30 sobreventa, >70 sobrecompra."><span className="text-xs text-muted-foreground">RSI(14)</span></Tooltip>
                  <span className="text-sm font-mono font-bold" style={{ color: indicators.rsi === null ? 'hsl(var(--muted-foreground))' : indicators.rsi >= 70 ? '#ef5350' : indicators.rsi <= 30 ? '#26a69a' : '#818cf8' }}>{indicators.rsi !== null ? indicators.rsi.toFixed(2) : '—'}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <Tooltip content="ADX(14). Mide fuerza de tendencia."><span className="text-xs text-muted-foreground">ADX(14)</span></Tooltip>
                  <span className="text-sm font-mono font-bold" style={{ color: indicators.adx === null ? 'hsl(var(--muted-foreground))' : indicators.adx >= 40 ? '#ef5350' : indicators.adx >= 25 ? '#fbbf24' : indicators.adx >= 20 ? '#60a5fa' : 'hsl(var(--muted-foreground))' }}>{indicators.adx !== null ? indicators.adx.toFixed(2) : '—'}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <Tooltip content="Stoch %K. <20 sobreventa, >80 sobrecompra."><span className="text-xs text-muted-foreground">Stoch %K</span></Tooltip>
                  <span className="text-sm font-mono font-bold" style={{ color: indicators.stochasticK === null ? 'hsl(var(--muted-foreground))' : indicators.stochasticK >= 80 ? '#ef5350' : indicators.stochasticK <= 20 ? '#26a69a' : '#818cf8' }}>{indicators.stochasticK !== null ? indicators.stochasticK.toFixed(2) : '—'}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <Tooltip content="Stoch %D. Media móvil de %K."><span className="text-xs text-muted-foreground">Stoch %D</span></Tooltip>
                  <span className="text-sm font-mono font-bold" style={{ color: indicators.stochasticD === null ? 'hsl(var(--muted-foreground))' : indicators.stochasticD >= 80 ? '#ef5350' : indicators.stochasticD <= 20 ? '#26a69a' : '#818cf8' }}>{indicators.stochasticD !== null ? indicators.stochasticD.toFixed(2) : '—'}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <Tooltip content="Bandas de Bollinger (20, 2).">
                    <button onClick={() => setShowBollinger(!showBollinger)} className={`text-xs px-2 py-1 rounded transition-colors border ${showBollinger ? 'bg-primary/20 text-primary border-primary/50' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}>
                      {showBollinger ? <Eye className="w-3 h-3 inline mr-1" /> : <EyeOff className="w-3 h-3 inline mr-1" />}Bollinger
                    </button>
                  </Tooltip>
                  <span className="text-sm font-mono font-bold text-primary">{showBollinger ? '✓' : '◯'}</span>
                </div>
              </div>
            </div>
            <IndicatorLegend isOpen={false} />
            <div className="bg-card rounded-xl border border-border overflow-hidden"><ChatPanel symbol={selectedAsset.symbol} timeframe={selectedTimeframe} /></div>
            <div className="bg-card rounded-xl border border-border overflow-hidden"><NewsFeed symbol={selectedAsset.symbol} /></div>
          </div>
        </div>
      </main>

      <AlertManager />
    </div>
  );
}
