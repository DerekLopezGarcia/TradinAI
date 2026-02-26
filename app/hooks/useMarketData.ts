import { useState, useEffect, useCallback } from 'react';
import { CandleData, TimeFrame } from '@/lib/types';
import { generateMockCandleData } from '@/lib/mockData';

export function useMarketData(symbol: string, interval: TimeFrame) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Aquí en una aplicación real, llamarías a tu API
        // const response = await fetch(`/api/market/history?symbol=${symbol}&interval=${interval}`);
        // const data = await response.json();

        const mockData = generateMockCandleData(symbol, interval, 60);
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, interval]);

  return { data, loading, error };
}

export function usePriceUpdate(symbol: string) {
  const [price, setPrice] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      // Simular cambio de precio
      setPrice((prev) => {
        const change = (Math.random() - 0.5) * 100;
        return prev + change;
      });

      setTimeout(() => setIsUpdating(false), 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { price, isUpdating };
}

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

