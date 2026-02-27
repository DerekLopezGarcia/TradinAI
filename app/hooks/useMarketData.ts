import { useState, useEffect } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';

export function useMarketData(symbol: string, interval: TimeFrame) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/market?symbol=${symbol}&type=history&interval=${interval}&t=${Date.now()}`
        );

        if (!response.ok) {
          throw new Error('Error loading data');
        }

        const result = await response.json();
        setData(result.data || []);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading data';
        setError(errorMessage);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    // Cargar datos inmediatamente
    loadData();

    // Recargar datos cada 30 segundos para mostrar nuevos movimientos
    const interval30s = setInterval(loadData, 30000);

    return () => clearInterval(interval30s);
  }, [symbol, interval]);

  return { data, loading, error };
}

