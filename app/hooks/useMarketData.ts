import { useState, useEffect, useRef, useCallback } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';

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
      const res = await fetch(
        `/api/market?symbol=${symbol}&type=price&t=${Date.now()}`
      );
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
    // Limpiar datos del asset anterior inmediatamente
    dataRef.current = [];
    setData([]);
    setLoading(true);
    setError(null);

    const cancelled = { value: false };

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `/api/market?symbol=${symbol}&type=history&interval=${interval}&t=${Date.now()}`
        );
        if (cancelled.value) return;
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const result = await res.json();
        if (cancelled.value) return;

        // Si el servidor devuelve error real (sin datos), lo mostramos
        if (!result.data || result.data.length === 0) {
          throw new Error('Sin datos para este símbolo/intervalo');
        }

        const candles: CandleData[] = result.data;
        dataRef.current = candles;
        setData(candles);
        setError(null);
      } catch (err) {
        if (cancelled.value) return;
        setError(err instanceof Error ? err.message : 'Error cargando datos');
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
