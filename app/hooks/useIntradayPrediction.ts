/**
 * Hook para predicciones intraday - T2.3
 */

import { useEffect, useState } from 'react';
import { intradayPredictionService, IntradayPrediction } from '@/lib/services/intradayPredictionService';
import { CandleData, TimeFrame } from '@/lib/types';

export interface UseIntradayPredictionProps {
  symbol: string;
  currentCandles: CandleData[];
  historicalCandles: CandleData[];
  currentPrice: number;
  timeframe?: TimeFrame;  // Optional timeframe for prediction (maps to 4h/8h/24h)
  enabled?: boolean;
}

export function useIntradayPrediction({
  symbol,
  currentCandles,
  historicalCandles,
  currentPrice,
  timeframe = '1h',
  enabled = true
}: UseIntradayPredictionProps) {
  const [prediction, setPrediction] = useState<IntradayPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Early return if disabled or missing required data
    // Note: currentPrice can legitimately be 0, so check explicitly for undefined/NaN
    if (!enabled || !currentCandles.length || currentPrice === undefined || Number.isNaN(currentPrice)) {
      setPrediction(null);
      setLoading(false);
      setError(null);
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
          currentPrice,
          timeframe
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
  }, [symbol, currentCandles, historicalCandles, currentPrice, timeframe, enabled]);

  return { prediction, loading, error };
}

export default useIntradayPrediction;

