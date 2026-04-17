/**
 * app/hooks/useUserAlerts.ts
 *
 * Hook para gestionar alertas del usuario desde PostgreSQL
 * Integración con API /api/db/alerts
 */

import { useAsync } from './useAsync';

export interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
  condition_type: 'price_above' | 'price_below' | 'percent_change' | 'technical_signal';
  target_price?: number;
  trigger_percentage?: number;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at?: string;
  frequency: 'once' | 'always' | 'daily';
  created_at: string;
  updated_at: string;
  last_notification_at?: string;
}

export interface UseUserAlertsOptions {
  userId?: string;
  symbol?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener alertas del usuario
 */
export function useUserAlerts({ userId, symbol, enabled = true }: UseUserAlertsOptions) {
  const fetchAlerts = async () => {
    if (!enabled || !userId) return [];

    const params = new URLSearchParams();
    params.set('user_id', userId);
    if (symbol) params.set('symbol', symbol);
    params.set('limit', '100');

    const response = await fetch(`/api/db/alerts?${params.toString()}`);
    if (!response.ok) throw new Error('Error fetching alerts');
    return response.json();
  };

  return useAsync(fetchAlerts, {
    retry: 3,
  });
}

/**
 * Hook para crear alerta
 */
export function useCreateAlert() {
  return async (data: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'is_triggered' | 'triggered_at'>) => {
    const response = await fetch('/api/db/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error creating alert');
    }

    return response.json();
  };
}

/**
 * Hook para obtener alerta por ID
 */
export function useAlert(alertId?: string) {
  const fetchAlert = async () => {
    if (!alertId) return null;

    const response = await fetch(`/api/db/alerts/${alertId}`);
    if (!response.ok) throw new Error('Error fetching alert');
    return response.json();
  };

  return useAsync(fetchAlert, {
    retry: 3,
  });
}

/**
 * Hook para actualizar alerta
 */
export function useUpdateAlert() {
  return async (alertId: string, updates: Partial<Alert>) => {
    const response = await fetch(`/api/db/alerts/${alertId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating alert');
    }

    return response.json();
  };
}

/**
 * Hook para eliminar alerta
 */
export function useDeleteAlert() {
  return async (alertId: string) => {
    const response = await fetch(`/api/db/alerts/${alertId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting alert');
    }

    return response.json();
  };
}

/**
 * Hook para marcar alerta como disparada
 */
export function useMarkAlertTriggered() {
  return async (alertId: string) => {
    const response = await fetch(`/api/db/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error marking alert as triggered');
    }

    return response.json();
  };
}

/**
 * Hook para resetear alerta (desmarcar disparada)
 */
export function useResetAlert() {
  return async (alertId: string) => {
    const response = await fetch(`/api/db/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error resetting alert');
    }

    return response.json();
  };
}




