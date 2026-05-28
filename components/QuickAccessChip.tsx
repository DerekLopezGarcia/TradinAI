'use client';

import { X } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface QuickAccessChipProps {
  symbol: string;
  onUnpin: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

export function QuickAccessChip({ symbol, onUnpin, onSelect }: QuickAccessChipProps) {
  const { t } = useTranslation();
  const assets = useMarketStore((s) => s.assets);
  const asset = assets.find((a) => a.symbol === symbol);

  return (
    <div
      onClick={() => onSelect(symbol)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(symbol)}
      role="button"
      tabIndex={0}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-xs font-medium transition-colors group cursor-pointer"
    >
      <span className="text-foreground font-semibold">{symbol}</span>
      {asset && asset.price > 0 && (
        <>
          <span className="font-mono text-foreground/80">${asset.price.toFixed(2)}</span>
          <span className={`font-mono ${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
          </span>
        </>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onUnpin(symbol); }}
        className="p-0.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
        aria-label={t('quickAccess.unpin', { symbol })}
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}
