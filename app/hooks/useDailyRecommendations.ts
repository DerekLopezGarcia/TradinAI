/**
 * Hook para obtener recomendaciones diarias de activos
 * Escanea todos los activos disponibles y encuentra los mejores con RI >= 10%
 */

'use client';

import { useState, useCallback } from 'react';
import { 
  scanAllAssets, 
  getSavedRecommendations, 
  saveRecommendations,
  DailyRecommendation,
  ScanResult 
} from '@/lib/services/assetScannerService';

export interface UseDailyRecommendationsReturn {
  recommendations: DailyRecommendation | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: () => Promise<void>;
  topRoi: ScanResult[];
  byCategory: { [key: string]: ScanResult[] };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

/**
 * Hook que maneja el escaneo y obtención de recomendaciones
 */
export function useDailyRecommendations(): UseDailyRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<DailyRecommendation | null>(
    () => getSavedRecommendations()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  const fetchRecommendations = useCallback(async () => {
    // Verificar si ya tenemos recomendaciones del día
    const saved = getSavedRecommendations();
    if (saved) {
      setRecommendations(saved);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0, percentage: 0 });

    try {
      const result = await scanAllAssets();
      setRecommendations(result);
      saveRecommendations(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al escanear activos';
      setError(errorMessage);
      setRecommendations(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
    topRoi: recommendations?.topRoi || [],
    byCategory: recommendations?.byCategory || {},
    progress,
  };
}

