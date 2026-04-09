/**
 * Hook para gestionar alertas - T2.4
 */

import { useEffect, useState, useCallback } from 'react';
import { alertService, Alert, AlertCondition, AlertTriggerEvent, AlertNotificationType } from '@/lib/services/alertService';
import { CandleData } from '@/lib/types';

export interface UseAlertsProps {
  symbol?: string;
  currentPrice?: number;
  candles?: CandleData[];
  enabled?: boolean;
}

export function useAlerts({
  symbol,
  currentPrice,
  candles,
  enabled = true
}: UseAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggeredEvents, setTriggeredEvents] = useState<AlertTriggerEvent[]>([]);

  // Cargar alertas al montar
  useEffect(() => {
    const loadedAlerts = alertService.getAlerts();
    setAlerts(loadedAlerts);
  }, []);

  // Crear alerta
  const createAlert = useCallback((
    name: string,
    condition: AlertCondition,
    options?: {
      notificationType?: AlertNotificationType;
      soundEnabled?: boolean;
      minMinutesBetweenAlerts?: number;
    }
  ) => {
    if (!symbol) {
      console.error('useAlerts: symbol is required to create alert');
      return null;
    }

    try {
      const newAlert = alertService.createAlert(symbol, name, condition, options);
      setAlerts(alertService.getAlerts());
      return newAlert;
    } catch (error) {
      console.error('useAlerts: error creating alert:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }, [symbol]);

  // Actualizar alerta
  const updateAlert = useCallback((id: string, updates: Partial<Alert>) => {
    const updated = alertService.updateAlert(id, updates);
    if (updated) {
      setAlerts(alertService.getAlerts());
    }
    return updated;
  }, []);

  // Eliminar alerta
  const deleteAlert = useCallback((id: string) => {
    const deleted = alertService.deleteAlert(id);
    if (deleted) {
      setAlerts(alertService.getAlerts());
    }
    return deleted;
  }, []);

  // Habilitar/deshabilitar alerta
  const setAlertEnabled = useCallback((id: string, enabled: boolean) => {
    const updated = alertService.setAlertEnabled(id, enabled);
    if (updated) {
      setAlerts(alertService.getAlerts());
    }
    return updated;
  }, []);

  // Verificar alertas cuando hay datos nuevos
  useEffect(() => {
    if (!enabled || !symbol || currentPrice === undefined) {
      return;
    }

    const events = alertService.checkAllAlerts(symbol, currentPrice, candles ?? []);

    if (events.length > 0) {
      // Procesar eventos: notifica observadores y envía notificaciones web
      alertService.processTriggerEvents(events);

      // Agregar a state solo una vez
      setTriggeredEvents(prev => [...prev, ...events].slice(-50)); // Mantener últimos 50
    }
  }, [symbol, currentPrice, candles, enabled]);


  return {
    alerts: symbol ? alerts.filter(a => a.symbol === symbol) : alerts,
    allAlerts: alerts,
    triggeredEvents,
    createAlert,
    updateAlert,
    deleteAlert,
    setAlertEnabled,
    clearTriggeredEvents: () => setTriggeredEvents([])
  };
}

export default useAlerts;

