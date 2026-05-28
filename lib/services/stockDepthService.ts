import type { OrderBookSnapshot, ConnectionState } from '@/lib/types';

type QuoteCallback = (snapshot: OrderBookSnapshot) => void;

interface AlpacaQuote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: number;
}

/**
 * Stock depth service:
 * - Polls Alpaca Markets' latest quote (Level 1 data) every N seconds
 * - Returns OrderBookSnapshot-compatible data for the HeatmapWidget
 */
class StockDepthService {
  private polls = new Map<string, ReturnType<typeof setInterval>>();
  private listeners = new Map<string, Set<QuoteCallback>>();
  private statusListeners = new Map<string, Set<(state: ConnectionState) => void>>();

  private pollInterval = 3000;

  subscribe(
    symbol: string,
    onDepth: QuoteCallback,
    onStatus?: (state: ConnectionState) => void
  ): () => void {
    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, new Set());
      this.statusListeners.set(symbol, new Set());
    }
    this.listeners.get(symbol)!.add(onDepth);
    if (onStatus) this.statusListeners.get(symbol)!.add(onStatus);

    if (!this.polls.has(symbol)) {
      this.emitStatus(symbol, 'connecting');
      this.fetchAndNotify(symbol);
      this.polls.set(
        symbol,
        setInterval(() => this.fetchAndNotify(symbol), this.pollInterval)
      );
      this.emitStatus(symbol, 'connected');
    }

    return () => {
      const subs = this.listeners.get(symbol);
      subs?.delete(onDepth);
      if (subs?.size === 0) {
        this.listeners.delete(symbol);
        this.statusListeners.delete(symbol);
        const timer = this.polls.get(symbol);
        if (timer) {
          clearInterval(timer);
          this.polls.delete(symbol);
        }
        this.emitStatus(symbol, 'disconnected');
      }
    };
  }

  async fetchQuoteSnapshot(symbol: string): Promise<{ snapshot: OrderBookSnapshot } | { error: string }> {
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body.error || `Error HTTP ${res.status}` };
      }
      const quote: AlpacaQuote = await res.json();
      if (quote.bidPrice === 0 && quote.askPrice === 0) {
        return { error: 'Mercado cerrado o sin cotizaciones disponibles' };
      }
      return {
        snapshot: {
          symbol,
          bids: [
            { price: quote.bidPrice, size: quote.bidSize, total: quote.bidSize },
          ],
          asks: [
            { price: quote.askPrice, size: quote.askSize, total: quote.askSize },
          ],
          timestamp: quote.timestamp,
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error de conexión' };
    }
  }

  private async fetchAndNotify(symbol: string): Promise<void> {
    const result = await this.fetchQuoteSnapshot(symbol);
    if ('error' in result) return;
    const subs = this.listeners.get(symbol);
    subs?.forEach((cb) => cb(result.snapshot));
  }

  private emitStatus(symbol: string, state: ConnectionState): void {
    this.statusListeners.get(symbol)?.forEach((cb) => cb(state));
  }

  destroy(): void {
    for (const [symbol, timer] of this.polls) {
      clearInterval(timer);
    }
    this.polls.clear();
    this.listeners.clear();
    this.statusListeners.clear();
  }
}

export const stockDepthService = new StockDepthService();
