import { useState, useEffect, useRef, useCallback } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import { validateSymbol, validateTimeFrame, createSafeParams } from '@/lib/services/validationService';

// Función para detectar el tipo de activo basado en el símbolo
function detectAssetType(symbol: string): 'crypto' | 'stock' | 'forex' | 'index' | 'commodity' {
  // Criptomonedas
  const cryptoSymbols = new Set([
    'BTCUSD', 'ETHUSD', 'BNBUSD', 'XRPUSD', 'SOLBUSD', 'DOGEUSD', 'ADAUSD', 'POLYUSD',
    'AVAXUSD', 'LINKUSD', 'MATICUSD', 'LTCUSD', 'DOTUSD', 'ETCUSD', 'XMRUSD', 'DASHUSD',
    'ZECUSD', 'XLMUSD', 'XTZUSD', 'COSMUSD', 'FILUSD', 'WAVESUSD', 'NEARUSD', 'ATOMUSD',
    'ALGOUSD', 'VETUSD', 'IOTAUSD', 'HBARUSD', 'CHZUSD', 'SANDUSD', 'SUIUSD', 'ARBUSD'
  ]);

  // Índices
  const indices = new Set([
    'SPX', 'NDX', 'DXY', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX',
    'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 'RUSINDEX',
    'MEXBOL', 'BOVESPA', 'KLCI', 'SET'
  ]);

  // Forex
  const forex = new Set([
    'EURUSD', 'EURGBP', 'EURJPY', 'EURCHF', 'EURCAD', 'EURAUD', 'EURNZD',
    'GBPUSD', 'GBPJPY', 'GBPCHF', 'GBPCAD', 'GBPAUD', 'GBPNZD',
    'JPYUSD', 'CHFJPY', 'CADJPY', 'AUDJPY', 'NZDJPY',
    'CHFUSD', 'CADUSD', 'AUDUSD', 'NZDUSD', 'SGDUSD', 'HKDUSD', 'NOKUSD',
    'BRLRSD', 'INRUSD', 'ZARUSD', 'MXNUSD', 'SEKUSD', 'DKKUSD'
  ]);

  // Commodities
  const commodities = new Set([
    'GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'OIL', 'GASOIL', 'NATGAS',
    'BRENT', 'WTI', 'WHEAT', 'CORN', 'SOYBEANS', 'SUGAR', 'COFFEE', 'COCOA', 'COTTON',
    'LUMBER', 'NICKEL', 'ALUMINUM', 'ZINC', 'TIN', 'RICE'
  ]);

  if (cryptoSymbols.has(symbol)) return 'crypto';
  if (indices.has(symbol)) return 'index';
  if (forex.has(symbol)) return 'forex';
  if (commodities.has(symbol)) return 'commodity';
  
  // Default: stock (para acciones)
  return 'stock';
}

export function useMarketData(symbol: string, interval: TimeFrame) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback] = useState(false); // siempre false — sin datos simulados

  const dataRef = useRef<CandleData[]>([]);

  // ── Polling de precio live (10 s para no exceder rate limit) ──────
  const pollPrice = useCallback(async () => {
    if (dataRef.current.length === 0) return;
    try {
      // Validar entrada antes de usar
      if (!validateSymbol(symbol)) {
        console.warn('Invalid symbol:', symbol);
        return;
      }

      const params = createSafeParams({
        symbol,
        type: 'price',
        t: Date.now()
      });

      const res = await fetch(`/api/market?${params.toString()}`);
      if (!res.ok) return;
      const priceData = await res.json();
      const livePrice: number = priceData.price;
      if (!livePrice || isNaN(livePrice)) return;

      setData((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        last.close = livePrice;
        if (livePrice > last.high) last.high = livePrice;
        if (livePrice < last.low)  last.low  = livePrice;
        updated[updated.length - 1] = last;
        dataRef.current = updated;
        return updated;
      });
    } catch {
      /* silencioso */
    }
  }, [symbol]);

  // ── Carga / recarga del historial real ────────────────────────────
  useEffect(() => {
    // Validar entrada
    if (!validateSymbol(symbol) || !validateTimeFrame(interval)) {
      setError('Símbolo o intervalo inválido');
      setLoading(false);
      console.warn(`Invalid input - Symbol: ${symbol}, Interval: ${interval}`);
      return;
    }

    // Limpiar datos del asset anterior inmediatamente
    dataRef.current = [];
    setData([]);
    setLoading(true);
    setError(null);

    const cancelled = { value: false };

    const loadHistory = async () => {
      try {
        // Detectar tipo de activo basado en símbolo
        const assetType = detectAssetType(symbol);
        console.log(`📊 Cargando ${symbol} (${assetType}) [${interval}]`);

        // Usar endpoint /api/market/candles con tipo de activo correcto
        const url = `/api/market/candles?symbol=${symbol}&interval=${interval}&type=${assetType}`;
        console.log(`  URL: ${url}`);

        const res = await fetch(url);
        if (cancelled.value) return;
        
        if (!res.ok) {
          if (res.status === 404) {
            // 404 es esperado para algunos símbolos, simplemente mostrar Sin datos
            console.log(`  ⚠️ No hay datos para ${symbol}`);
            setError(null);
            setData([]);
            dataRef.current = [];
            setLoading(false);
            return;
          }
          throw new Error(`Error ${res.status} del servidor`);
        }

        const result = await res.json();
        if (cancelled.value) return;

        // Si el servidor devuelve error real (sin datos), lo mostramos
        if (!result.candles || result.candles.length === 0) {
          console.log(`  ⚠️ Sin datos para ${symbol}/${interval}`);
          setError(null);
          setData([]);
          dataRef.current = [];
          setLoading(false);
          return;
        }

        const candles: CandleData[] = result.candles;
        console.log(`  ✅ Cargadas ${candles.length} velas`);
        
        // Si hay advertencia, mostrarla pero no bloquear
        if (result.warning) {
          console.log(`  ℹ️ ${result.warning}`);
        }
        
        dataRef.current = candles;
        setData(candles);
        setError(null);
      } catch (err) {
        if (cancelled.value) return;
        const errorMsg = err instanceof Error ? err.message : 'Error cargando datos';
        console.error(`  ❌ ${errorMsg}`);
        setError(null); // No mostrar error en la UI
        setData([]);
        dataRef.current = [];
      } finally {
        if (!cancelled.value) setLoading(false);
      }
    };

    loadHistory();
    // Recargar historial cada 2 minutos (respeta rate limits)
    const historyTimer = setInterval(loadHistory, 120_000);

    return () => {
      cancelled.value = true;
      clearInterval(historyTimer);
    };
  }, [symbol, interval]);

  // ── Polling de precio cada 10 s (respeta rate limit) ────
  useEffect(() => {
    const priceTimer = setInterval(pollPrice, 10_000);
    // Primera llamada inmediata
    pollPrice();
    return () => clearInterval(priceTimer);
  }, [pollPrice]);

  return { data, loading, error, isFallback };
}
