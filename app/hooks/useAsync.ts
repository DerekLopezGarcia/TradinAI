/**
 * HOOKS REACT REUTILIZABLES Y ESCALABLES
 * 
 * Hooks base que pueden ser extendidos para cualquier funcionalidad
 */

import { useState, useCallback, useEffect, useRef, useReducer } from 'react';
import { AsyncState, createAsyncState, updateAsyncState, retryWithBackoff } from '@/lib/core/services';

// ============================================================================
// useAsync - Hook genérico para operaciones asincrónicas
// ============================================================================

interface UseAsyncOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number;
  cacheKey?: string;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>(
    createAsyncState(options.initialData)
  );

  const execute = useCallback(async () => {
    setState(prev => updateAsyncState(prev, { loading: true }));

    try {
      const data = await retryWithBackoff(asyncFunction, {
        maxAttempts: options.retry || 3,
        delay: 500,
        backoffMultiplier: 2
      });

      setState(prev => updateAsyncState(prev, {
        data,
        loading: false,
        error: null,
        isSuccess: true
      }));

      options.onSuccess?.(data);
    } catch (error) {
      const err = error as Error;
      setState(prev => updateAsyncState(prev, {
        error: err,
        loading: false,
        isSuccess: false
      }));

      options.onError?.(err);
    }
  }, [asyncFunction, options]);

  return { ...state, execute, retry: execute };
}

// ============================================================================
// useAsyncEffect - useAsync con effect automático
// ============================================================================

export function useAsyncEffect<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncOptions<T> = {}
) {
  const { execute, ...state } = useAsync(asyncFunction, options);

  useEffect(() => {
    execute();
  }, dependencies);

  return state;
}

// ============================================================================
// useLocalStorage - Hook para localStorage con sincronización
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// ============================================================================
// useDebounce - Hook para debounce de valores
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useThrottle - Hook para throttle de funciones
// ============================================================================

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRunRef = useRef(Date.now());

  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastRunRef.current >= delay) {
      lastRunRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

// ============================================================================
// usePrevious - Hook para acceder al valor anterior
// ============================================================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// useReducer escalable - Hook para estado complejo
// ============================================================================

type Action<T = any> = { type: string; payload?: T };

export function useReducerWithCallback<S, A extends Action>(
  reducer: (state: S, action: A) => S,
  initialState: S,
  onStateChange?: (newState: S) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  return [state, dispatch] as const;
}

// ============================================================================
// useInterval - Hook para ejecutar función periódicamente
// ============================================================================

export function useInterval(
  callback: () => void,
  delay: number | null = 1000,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (delay === null) return;

    const interval = setInterval(callback, delay);
    return () => clearInterval(interval);
  }, [callback, delay, ...dependencies]);
}

// ============================================================================
// useAsync con caché - Hook para operaciones con caché integrado
// ============================================================================

const globalCache = new Map<string, any>();

export function useAsyncWithCache<T>(
  cacheKey: string,
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> & { cacheTTL?: number } = {}
) {
  const [state, setState] = useState<AsyncState<T>>(() => {
    const cached = globalCache.get(cacheKey);
    if (cached) {
      return updateAsyncState(createAsyncState(cached.data), {
        isSuccess: true,
        loading: false
      });
    }
    return createAsyncState(options.initialData);
  });

  const execute = useCallback(async () => {
    setState(prev => updateAsyncState(prev, { loading: true }));

    try {
      const data = await retryWithBackoff(asyncFunction, {
        maxAttempts: options.retry || 3,
        delay: 500
      });

      globalCache.set(cacheKey, { data, timestamp: Date.now() });

      setState(prev => updateAsyncState(prev, {
        data,
        loading: false,
        error: null,
        isSuccess: true
      }));

      options.onSuccess?.(data);
    } catch (error) {
      const err = error as Error;
      setState(prev => updateAsyncState(prev, {
        error: err,
        loading: false,
        isSuccess: false
      }));

      options.onError?.(err);
    }
  }, [cacheKey, asyncFunction, options]);

  useEffect(() => {
    const cached = globalCache.get(cacheKey);
    if (!cached) {
      execute();
    }
  }, [cacheKey, execute]);

  return { ...state, execute, refetch: execute };
}

// ============================================================================
// useObservable - Hook para sincronizar con observables/event emitters
// ============================================================================

export function useObservable<T>(
  observable: { on(event: string, handler: (data: T) => void): () => void },
  event: string,
  initialValue: T
) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const unsubscribe = observable.on(event, setValue);
    return unsubscribe;
  }, [observable, event]);

  return value;
}

// ============================================================================
// useMediaQuery - Hook para media queries
// ============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// ============================================================================
// useMountedState - Hook para saber si componente está montado
// ============================================================================

export function useMountedState() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

// ============================================================================
// useAsync con cancelación - Hook para operaciones cancelables
// ============================================================================

export function useCancelableAsync<T>(
  asyncFunction: (signal: AbortSignal) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>(
    createAsyncState(options.initialData)
  );

  const abortControllerRef = useRef<AbortController>();

  const execute = useCallback(async () => {
    // Cancelar petición anterior si existe
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => updateAsyncState(prev, { loading: true }));

    try {
      const data = await asyncFunction(abortControllerRef.current.signal);

      setState(prev => updateAsyncState(prev, {
        data,
        loading: false,
        error: null,
        isSuccess: true
      }));

      options.onSuccess?.(data);
    } catch (error) {
      // Ignorar errores de cancelación
      if ((error as any).name === 'AbortError') return;

      const err = error as Error;
      setState(prev => updateAsyncState(prev, {
        error: err,
        loading: false,
        isSuccess: false
      }));

      options.onError?.(err);
    }
  }, [asyncFunction, options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => updateAsyncState(prev, { loading: false }));
  }, []);

  return { ...state, execute, cancel, refetch: execute };
}

// ============================================================================
// useAsync con paginación - Hook para datos paginados
// ============================================================================

interface PaginatedState<T> extends AsyncState<T[]> {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function usePaginatedAsync<T>(
  asyncFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  initialPageSize: number = 20
) {
  const [state, setState] = useState<PaginatedState<T>>({
    data: [],
    loading: false,
    error: null,
    isSuccess: false,
    timestamp: Date.now(),
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    hasMore: false
  });

  const execute = useCallback(async (page: number = 1) => {
    setState(prev => updateAsyncState(prev, { loading: true, page }) as any);

    try {
      const { data, total } = await asyncFunction(page, state.pageSize);
      const hasMore = page * state.pageSize < total;

      setState(prev => updateAsyncState(prev, {
        data: page === 1 ? data : [...(prev.data || []), ...data],
        loading: false,
        error: null,
        isSuccess: true,
        page,
        total,
        hasMore
      }) as any);
    } catch (error) {
      setState(prev => updateAsyncState(prev, {
        error: error as Error,
        loading: false,
        isSuccess: false
      }) as any);
    }
  }, [asyncFunction, state.pageSize]);

  const nextPage = useCallback(() => execute(state.page + 1), [execute, state.page]);
  const previousPage = useCallback(() => execute(Math.max(1, state.page - 1)), [execute, state.page]);
  const goToPage = useCallback((page: number) => execute(page), [execute]);

  return {
    ...state,
    execute,
    nextPage,
    previousPage,
    goToPage
  };
}

