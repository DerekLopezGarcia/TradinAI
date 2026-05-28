'use client';

import { useState, useEffect, useCallback } from 'react';
import { marketHoursService } from '@/lib/services/marketHoursService';
import type { WidgetProps } from '@/lib/widgetRegistry';

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

export function MarketStatusWidget({ symbol }: WidgetProps) {
  const [now, setNow] = useState(Date.now());

  const update = useCallback(() => setNow(Date.now()), []);

  useEffect(() => {
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [update]);

  const isCrypto = symbol.endsWith('USD') || symbol.endsWith('USDT');
  if (isCrypto) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-1 p-4">
        <span className="text-lg">🔄</span>
        <span className="text-xs font-semibold text-green-400">24/7</span>
        <span className="text-[10px] text-muted-foreground">Mercado continuo</span>
      </div>
    );
  }

  const status = marketHoursService.getMarketStatus(symbol);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
      <div className={`w-3 h-3 rounded-full ${status.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className={`text-xs font-bold ${status.isOpen ? 'text-green-400' : 'text-red-400'}`}>
        {status.isOpen ? 'ABIERTO' : 'CERRADO'}
      </span>
      <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
        {status.isOpen ? (
          <>Cierre: {status.closeTime.getUTCHours().toString().padStart(2, '0')}:{status.closeTime.getUTCMinutes().toString().padStart(2, '0')} UTC</>
        ) : (
          <>Apertura: {status.openTime.getUTCHours().toString().padStart(2, '0')}:{status.openTime.getUTCMinutes().toString().padStart(2, '0')} UTC</>
        )}
      </div>
      <div className="text-[10px] font-mono text-foreground">
        {fmtCountdown(Math.max(0, status.nextEventTime.getTime() - now))}
      </div>
    </div>
  );
}

export default MarketStatusWidget;
