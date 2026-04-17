/**
 * app/hooks/useUserWatchlists.ts
 *
 * Hook para gestionar watchlists del usuario desde PostgreSQL
 * Integración con API /api/db/watchlists
 */

import { useAsync } from './useAsync';

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  added_at: string;
}

export interface UseUserWatchlistsOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener watchlists del usuario
 */
export function useUserWatchlists({ userId, enabled = true }: UseUserWatchlistsOptions) {
  const fetchWatchlists = async () => {
    if (!enabled || !userId) return [];

    const params = new URLSearchParams();
    params.set('user_id', userId);

    const response = await fetch(`/api/db/watchlists?${params.toString()}`);
    if (!response.ok) throw new Error('Error fetching watchlists');
    return response.json();
  };

  return useAsync(fetchWatchlists, {
    retry: 3,
  });
}

/**
 * Hook para obtener una watchlist específica
 */
export function useWatchlist(watchlistId?: string) {
  const fetchWatchlist = async () => {
    if (!watchlistId) return null;

    const response = await fetch(`/api/db/watchlists/${watchlistId}`);
    if (!response.ok) throw new Error('Error fetching watchlist');
    return response.json();
  };

  return useAsync(fetchWatchlist, {
    retry: 3,
  });
}

/**
 * Hook para crear watchlist
 */
export function useCreateWatchlist() {
  return async (userId: string, name: string, description?: string, is_default?: boolean) => {
    const response = await fetch('/api/db/watchlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name,
        description,
        is_default: is_default || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating watchlist');
    }

    return response.json();
  };
}

/**
 * Hook para actualizar watchlist
 */
export function useUpdateWatchlist() {
  return async (watchlistId: string, updates: Partial<Watchlist>) => {
    const response = await fetch(`/api/db/watchlists/${watchlistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating watchlist');
    }

    return response.json();
  };
}

/**
 * Hook para eliminar watchlist
 */
export function useDeleteWatchlist() {
  return async (watchlistId: string) => {
    const response = await fetch(`/api/db/watchlists/${watchlistId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting watchlist');
    }

    return response.json();
  };
}

/**
 * Hook para obtener items de una watchlist
 */
export function useWatchlistItems(watchlistId?: string) {
  const fetchItems = async () => {
    if (!watchlistId) return [];

    const response = await fetch(`/api/db/watchlists/${watchlistId}/items`);
    if (!response.ok) throw new Error('Error fetching watchlist items');
    return response.json();
  };

  return useAsync(fetchItems, {
    retry: 3,
  });
}

/**
 * Hook para agregar item a watchlist
 */
export function useAddWatchlistItem() {
  return async (watchlistId: string, symbol: string, asset_type: string) => {
    const response = await fetch(`/api/db/watchlists/${watchlistId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, asset_type }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error adding item to watchlist');
    }

    return response.json();
  };
}

/**
 * Hook para remover item de watchlist
 */
export function useRemoveWatchlistItem() {
  return async (watchlistId: string, itemId: string) => {
    const response = await fetch(`/api/db/watchlists/${watchlistId}/items/${itemId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error removing item from watchlist');
    }

    return response.json();
  };
}




