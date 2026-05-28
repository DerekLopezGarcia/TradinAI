import type { OrderBookSnapshot, OrderBookLevel, ConnectionState } from '@/lib/types';

type DepthCallback = (snapshot: OrderBookSnapshot) => void;
type StatusCallback = (state: ConnectionState) => void;

interface Subscription {
  symbol: string;
  onDepth: DepthCallback;
  onStatus?: StatusCallback;
}

interface BookEntry {
  price: number;
  size: number;
}

/**
 * Binance full depth service:
 * - REST snapshot (100 levels) for initial state + lastUpdateId
 * - WebSocket depth@100ms (full diff stream) for real-time updates
 * - Maintains local order book, applies incremental diffs
 */
class DepthService {
  private ws: WebSocket | null = null;
  private baseUrl = 'wss://stream.binance.com:9443/ws';
  private subscriptions = new Map<string, Subscription[]>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;
  private destroyed = false;

  private subscribeSymbols: string[] = [];

  // Local order books keyed by normalized symbol
  private books = new Map<string, {
    bids: Map<number, number>;
    asks: Map<number, number>;
    lastUpdateId: number;
    buffer: any[];
  }>();

  private toBinancePair(symbol: string): string {
    return symbol.endsWith('USDT')
      ? symbol
      : symbol.endsWith('USD')
        ? symbol.slice(0, -3) + 'USDT'
        : symbol + 'USDT';
  }

  private getStreamName(symbol: string): string {
    return `${this.toBinancePair(symbol).toLowerCase()}@depth@100ms`;
  }

  private normalizeSymbol(symbol: string): string {
    return symbol.endsWith('USDT')
      ? symbol.replace('USDT', 'USD')
      : symbol;
  }

  private buildSubscribePayload(): object {
    return {
      method: 'SUBSCRIBE',
      params: this.subscribeSymbols.map((s) => this.getStreamName(s)),
      id: Date.now(),
    };
  }

  private computeCumulative(
    map: Map<number, number>,
    ascending: boolean
  ): { price: number; size: number; total: number }[] {
    const entries = Array.from(map.entries()).map(([price, size]) => ({ price, size }));
    entries.sort((a, b) => ascending ? a.price - b.price : b.price - a.price);
    let total = 0;
    for (const e of entries) {
      total += e.size;
    }
    const result: { price: number; size: number; total: number }[] = [];
    let running = 0;
    // For display: best price first, cumulative from outside in
    const displayOrder = ascending ? entries.reverse() : entries; // asks: worst first → best last, bids: best first → worst last
    // Actually for bids we want best bid first, for asks best ask first
    // ascending = true (asks): sorted ascending already has best ask first
    // ascending = false (bids): sorted descending already has best bid first
    if (ascending) {
      // asks: sorted low→high, we want cumulative from outside (high) → inside (low)
      // process high→low
      for (let i = entries.length - 1; i >= 0; i--) {
        running += entries[i].size;
        result.push({ price: entries[i].price, size: entries[i].size, total: running });
      }
      result.reverse(); // back to low→high (best ask first)
    } else {
      // bids: sorted high→low, we want cumulative from outside (low) → inside (high)
      // process low→high
      for (let i = entries.length - 1; i >= 0; i--) {
        running += entries[i].size;
        result.push({ price: entries[i].price, size: entries[i].size, total: running });
      }
      result.reverse(); // back to high→low (best bid first)
    }
    return result;
  }

  private applyDiff(symbol: string, diff: { U: number; u: number; b: [string, string][]; a: [string, string][] }): void {
    const book = this.books.get(symbol);
    if (!book) return;

    if (diff.u <= book.lastUpdateId) return;

    if (book.lastUpdateId > 0 && diff.U > book.lastUpdateId + 1) {
      this.resyncBook(symbol);
      return;
    }

    for (const [priceStr, sizeStr] of diff.b) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (size === 0) {
        book.bids.delete(price);
      } else {
        book.bids.set(price, size);
      }
    }

    for (const [priceStr, sizeStr] of diff.a) {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      if (size === 0) {
        book.asks.delete(price);
      } else {
        book.asks.set(price, size);
      }
    }

    book.lastUpdateId = diff.u;
  }

  private emitSnapshot(symbol: string): void {
    const book = this.books.get(symbol);
    if (!book) return;

    const subs = this.subscriptions.get(symbol);
    if (!subs || subs.length === 0) return;

    const snapshot: OrderBookSnapshot = {
      symbol,
      bids: this.computeCumulative(book.bids, false),
      asks: this.computeCumulative(book.asks, true),
      timestamp: Date.now(),
    };

    for (const sub of subs) {
      sub.onDepth(snapshot);
    }
  }

  private async resyncBook(symbol: string): Promise<void> {
    try {
      const data = await this.fetchRawDepth(symbol, 100);
      const book = this.books.get(symbol);
      if (!book) return;
      book.bids.clear();
      book.asks.clear();
      book.buffer = [];
      book.lastUpdateId = data.lastUpdateId;
      for (const [price, size] of data.bids as [string, string][]) {
        const s = parseFloat(size);
        if (s > 0) book.bids.set(parseFloat(price), s);
      }
      for (const [price, size] of data.asks as [string, string][]) {
        const s = parseFloat(size);
        if (s > 0) book.asks.set(parseFloat(price), s);
      }
      this.emitSnapshot(symbol);
    } catch {
      // silent
    }
  }

  private processBuffered(symbol: string): void {
    const book = this.books.get(symbol);
    if (!book) return;

    while (book.buffer.length > 0) {
      const diff = book.buffer[0];
      if (diff.U <= book.lastUpdateId + 1) {
        book.buffer.shift();
        this.applyDiff(symbol, diff);
        this.emitSnapshot(symbol);
      } else {
        break;
      }
    }
  }

  private connect(): void {
    if (this.destroyed) return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${this.baseUrl}/stream`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      if (this.subscribeSymbols.length > 0) {
        this.ws!.send(JSON.stringify(this.buildSubscribePayload()));
      }
      this.emitStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        if (raw.stream && raw.data) {
          const symbolRaw = raw.data.s as string;
          const symbol = this.normalizeSymbol(symbolRaw);
          const subs = this.subscriptions.get(symbol);
          if (!subs || subs.length === 0) return;

          const data = raw.data;
          const diff = {
            U: data.U as number,
            u: data.u as number,
            b: data.b as [string, string][],
            a: data.a as [string, string][],
          };

          const book = this.books.get(symbol);
          if (!book) return;

          if (book.lastUpdateId === 0) {
            book.buffer.push(diff);
            return;
          }

          if (book.buffer.length > 0) {
            book.buffer.push(diff);
            this.processBuffered(symbol);
            return;
          }

          this.applyDiff(symbol, diff);
          this.emitSnapshot(symbol);
        }
      } catch (err) {
        console.warn('[DepthService] WS parse error:', err);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.emitStatus('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.emitStatus('error');
    };
  }

  private emitStatus(state: ConnectionState): void {
    const allSubs = Array.from(this.subscriptions.values()).flat();
    for (const sub of allSubs) {
      sub.onStatus?.(state);
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  async fetchRawDepth(
    symbol: string,
    limit = 100
  ): Promise<{ bids: [string, string][]; asks: [string, string][]; lastUpdateId: number }> {
    const url = `/api/market/depth?symbol=${encodeURIComponent(symbol)}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error loading depth snapshot');
    return res.json();
  }

  subscribe(
    symbol: string,
    onDepth: DepthCallback,
    onStatus?: StatusCallback
  ): () => void {
    const sub: Subscription = { symbol, onDepth, onStatus };
    const existing = this.subscriptions.get(symbol) ?? [];
    existing.push(sub);
    this.subscriptions.set(symbol, existing);

    if (!this.books.has(symbol)) {
      this.books.set(symbol, { bids: new Map(), asks: new Map(), lastUpdateId: 0, buffer: [] });
    }

    if (!this.subscribeSymbols.includes(symbol)) {
      this.subscribeSymbols.push(symbol);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            method: 'SUBSCRIBE',
            params: [this.getStreamName(symbol)],
            id: Date.now(),
          })
        );
      }
    }

    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => {
      const subs = this.subscriptions.get(symbol) ?? [];
      const filtered = subs.filter((s) => s !== sub);
      if (filtered.length === 0) {
        this.subscriptions.delete(symbol);
        this.books.delete(symbol);
        this.subscribeSymbols = this.subscribeSymbols.filter(
          (s) => s !== symbol
        );
        if (
          this.ws?.readyState === WebSocket.OPEN &&
          !this.destroyed
        ) {
          this.ws.send(
            JSON.stringify({
              method: 'UNSUBSCRIBE',
              params: [this.getStreamName(symbol)],
              id: Date.now(),
            })
          );
        }
      } else {
        this.subscriptions.set(symbol, filtered);
      }
    };
  }

  fetchDepthSnapshot(
    symbol: string,
    limit = 100
  ): Promise<OrderBookSnapshot> {
    return this.fetchRawDepth(symbol, limit).then((data) => {
      const book = this.books.get(symbol);
      if (book) {
        book.lastUpdateId = data.lastUpdateId;
        book.bids.clear();
        book.asks.clear();
        for (const [price, size] of data.bids as [string, string][]) {
          const s = parseFloat(size);
          if (s > 0) book.bids.set(parseFloat(price), s);
        }
        for (const [price, size] of data.asks as [string, string][]) {
          const s = parseFloat(size);
          if (s > 0) book.asks.set(parseFloat(price), s);
        }
      }
      const bids = this.computeCumulative(
        book?.bids ?? new Map(),
        false
      );
      const asks = this.computeCumulative(
        book?.asks ?? new Map(),
        true
      );
      return { symbol, bids, asks, timestamp: Date.now() };
    });
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.subscribeSymbols = [];
    this.books.clear();
  }
}

export const depthService = new DepthService();
