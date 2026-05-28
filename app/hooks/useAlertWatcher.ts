'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMarketStore } from '@/lib/store';
import { alertService } from '@/lib/services/alertService';
import { CandleData } from '@/lib/types';
import toast from 'react-hot-toast';

interface UseAlertWatcherProps {
  symbol: string;
  interval?: number;
}

export function useAlertWatcher({ symbol, interval = 30000 }: UseAlertWatcherProps) {
  const addAlert = useMarketStore((s) => s.addAlert);
  const { assets } = useMarketStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPriceAndCheck = useCallback(async () => {
    try {
      const params = new URLSearchParams({ symbol: symbol.toUpperCase(), type: 'price' });
      const res = await fetch(`/api/market?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const currentPrice = parseFloat(data.price);
      if (isNaN(currentPrice)) return;

      const alertsForSymbol = alertService.getAlertsBySymbol(symbol.toUpperCase());
      if (alertsForSymbol.length === 0) return;

      const candles: CandleData[] = [];
      const candleRes = await fetch(`/api/market/candles?symbol=${symbol.toUpperCase()}&interval=1h`);
      if (candleRes.ok) {
        const candleData = await candleRes.json();
        if (candleData?.data?.length) {
          candles.push(...candleData.data);
        }
      }

      const triggered = alertService.checkAllAlerts(symbol.toUpperCase(), currentPrice, candles);
      if (triggered.length > 0) {
        alertService.processTriggerEvents(triggered);
        for (const event of triggered) {
          addAlert({
            id: `trigger_${Date.now()}_${event.alert.id}`,
            symbol: event.alert.symbol,
            type: event.alert.condition.type === 'price'
              ? (event.alert.condition.operator === 'gt' ? 'price_above' : 'price_below')
              : 'sma_cross',
            value: currentPrice,
            isActive: true,
            createdAt: Date.now(),
            triggeredAt: Date.now(),
          });
          toast.error(event.message, { duration: 6000, id: `alert_${event.alert.id}` });
        }
      }
    } catch {
      // Silently handle polling errors
    }
  }, [symbol, addAlert]);

  useEffect(() => {
    if (!symbol) return;

    fetchPriceAndCheck();
    timerRef.current = setInterval(fetchPriceAndCheck, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [symbol, interval, fetchPriceAndCheck]);
}
