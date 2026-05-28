'use client';

import { useState, useEffect, useRef } from 'react';
import type { OrderBookSnapshot, ConnectionState } from '@/lib/types';
import { stockDepthService } from '@/lib/services/stockDepthService';

interface UseStockDepthResult {
  snapshot: OrderBookSnapshot | null;
  connectionState: ConnectionState;
  spread: number;
  midPrice: number;
  bidTotal: number;
  askTotal: number;
  isLoading: boolean;
  error: string | null;
}

export function useStockDepth(symbol: string): UseStockDepthResult {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<OrderBookSnapshot | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);
    setSnapshot(null);
    snapshotRef.current = null;
    setConnectionState('connecting');

    stockDepthService.fetchQuoteSnapshot(symbol).then((result) => {
      if ('snapshot' in result) {
        snapshotRef.current = result.snapshot;
        setSnapshot(result.snapshot);
        setIsLoading(false);
        setError(null);
        setConnectionState('connected');
      }
    });

    const unsub = stockDepthService.subscribe(
      symbol,
      (update) => {
        snapshotRef.current = update;
        setSnapshot(update);
        setIsLoading(false);
        setError(null);
        setConnectionState('connected');
      },
      (state) => {
        setConnectionState(state);
      }
    );

    const timeoutTimer = setTimeout(async () => {
      if (!snapshotRef.current) {
        const result = await stockDepthService.fetchQuoteSnapshot(symbol);
        if ('error' in result) {
          setError(result.error);
        } else {
          snapshotRef.current = result.snapshot;
          setSnapshot(result.snapshot);
          setIsLoading(false);
          setError(null);
          setConnectionState('connected');
          return;
        }
        setIsLoading(false);
      }
    }, 8000);

    return () => {
      unsub();
      clearTimeout(timeoutTimer);
    };
  }, [symbol]);

  const spread =
    snapshot && snapshot.asks.length > 0 && snapshot.bids.length > 0
      ? snapshot.asks[0].price - snapshot.bids[0].price
      : 0;

  const midPrice =
    snapshot && snapshot.asks.length > 0 && snapshot.bids.length > 0
      ? (snapshot.asks[0].price + snapshot.bids[0].price) / 2
      : 0;

  const bidTotal =
    snapshot && snapshot.bids.length > 0
      ? snapshot.bids[0].total
      : 0;

  const askTotal =
    snapshot && snapshot.asks.length > 0
      ? snapshot.asks[0].total
      : 0;

  return {
    snapshot,
    connectionState,
    spread,
    midPrice,
    bidTotal,
    askTotal,
    isLoading,
    error,
  };
}
