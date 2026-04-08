/**
 * Hook para predicciones intraday - T2.3
 */

import { useEffect, useState } from 'react';
import { intradayPredictionService, IntradayPrediction } from '@/lib/services/intradayPredictionService';
import { CandleData } from '@/lib/types';

export interface UseIntradayPredictionProps {
  symbol: string;
  currentCandles: CandleData[];
  historicalCandles: CandleData[];
  currentPrice: number;
  enabled?: boolean;
}

export function useIntradayPrediction({
  symbol,
  currentCandles,
  historicalCandles,
  currentPrice,
  enabled = true
}: UseIntradayPredictionProps) {
  const [prediction, setPrediction] = useState<IntradayPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !currentCandles.length || !currentPrice) {
      setPrediction(null);
      return;
    }

    const generatePrediction = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generar predicción (es síncrono pero lo envolvemos en async para consistency)
        const pred = intradayPredictionService.predictMovement(
          symbol,
          currentCandles,
          historicalCandles,
          currentPrice
        );

        setPrediction(pred);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate prediction';
        setError(errorMessage);
        console.error('[IntradayPrediction Error]:', err);
      } finally {
        setLoading(false);
      }
    };

    generatePrediction();
  }, [symbol, currentCandles, historicalCandles, currentPrice, enabled]);

  return { prediction, loading, error };
}

export default useIntradayPrediction;

