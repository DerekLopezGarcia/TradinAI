'use client';

import { useState, useEffect, useRef } from 'react';
import type { OrderBookSnapshot, ConnectionState } from '@/lib/types';
import { depthService } from '@/lib/services/depthService';

interface UseOrderBookResult {
  snapshot: OrderBookSnapshot | null;
  connectionState: ConnectionState;
  spread: number;
  midPrice: number;
  bidTotal: number;
  askTotal: number;
  isLoading: boolean;
  error: string | null;
}

const STALE_THRESHOLD = 5000;

export function useOrderBook(symbol: string): UseOrderBookResult {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<OrderBookSnapshot | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const connectionRef = useRef<ConnectionState>('disconnected');

  useEffect(() => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);
    setSnapshot(null);
    snapshotRef.current = null;
    lastUpdateRef.current = 0;

    depthService.fetchDepthSnapshot(symbol).then((initial) => {
      snapshotRef.current = initial;
      setSnapshot(initial);
      lastUpdateRef.current = Date.now();
      setIsLoading(false);
    }).catch(() => {
      // REST fallback: WS enviará datos cuando conecte
    });

    const unsub = depthService.subscribe(
      symbol,
      (update) => {
        snapshotRef.current = update;
        setSnapshot(update);
        lastUpdateRef.current = Date.now();
        setIsLoading(false);
        setError(null);
      },
      (state) => {
        connectionRef.current = state;
        setConnectionState(state);
      }
    );

    const timeoutTimer = setTimeout(() => {
      if (!snapshotRef.current && connectionRef.current === 'disconnected') {
        setError('No se pudo conectar con el servidor de profundidad');
        setIsLoading(false);
      }
    }, 10000);

    const staleTimer = setInterval(() => {
      if (
        lastUpdateRef.current > 0 &&
        Date.now() - lastUpdateRef.current > STALE_THRESHOLD &&
        connectionRef.current === 'connected'
      ) {
        depthService.fetchDepthSnapshot(symbol).then((refresh) => {
          snapshotRef.current = refresh;
          setSnapshot(refresh);
          lastUpdateRef.current = Date.now();
        }).catch(() => {});
      }
    }, STALE_THRESHOLD);

    return () => {
      unsub();
      clearTimeout(timeoutTimer);
      clearInterval(staleTimer);
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
      ? snapshot.bids[snapshot.bids.length - 1].total
      : 0;

  const askTotal =
    snapshot && snapshot.asks.length > 0
      ? snapshot.asks[snapshot.asks.length - 1].total
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
