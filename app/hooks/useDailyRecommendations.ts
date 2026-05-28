/**
 * Hook para obtener recomendaciones diarias
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  scanAllAssets,
  getSavedRecommendations, 
  saveRecommendations,
  clearRecommendationsCache,
  DailyRecommendation,
  ScanResult 
} from '@/lib/services/assetScannerService';

export interface UseDailyRecommendationsReturn {
  recommendations: DailyRecommendation | null;
  isLoading: boolean;
  error: string | null;
  fetchRecommendations: (force?: boolean) => Promise<void>;
  topRoi: ScanResult[];
  byCategory: { [key: string]: ScanResult[] };
  progress: {
    current: number;
    total: number;
    percentage: number;
    currentSymbol: string;
  };
}

/**
 * Hook que maneja el escaneo y obtención de recomendaciones
 * Intenta cargar desde caché primero, luego escanea si es necesario
 */
export function useDailyRecommendations(): UseDailyRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<DailyRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0, currentSymbol: '' });

  // Cargar recomendaciones guardadas solo al montar el componente
  useEffect(() => {
    try {
      const saved = getSavedRecommendations();
      if (saved) {
        setRecommendations(saved);
      }
    } catch (err) {
      console.error('Error loading saved recommendations:', err);
      // Continuar, el usuario puede hacer escaneo manual
    }
  }, []);

  const fetchRecommendations = useCallback(async (force: boolean = false) => {
    if (force) {
      clearRecommendationsCache();
      setRecommendations(null);
    }

    if (!force) {
      const saved = getSavedRecommendations();
      if (saved) {
        setRecommendations(saved);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0, percentage: 0, currentSymbol: '' });

    try {
      const result = await scanAllAssets((progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      if (result) {
        setRecommendations(result);
        saveRecommendations(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al escanear activos';
      setError(errorMessage);
      setRecommendations(null);
      
      // Intentar usar caché antiguo si está disponible
      try {
        const oldCache = getSavedRecommendations();
        if (oldCache) {
          setRecommendations(oldCache);
          setError(errorMessage + ' (usando caché anterior)');
        }
      } catch { /* ignorar */ }
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

