'use client';

import { useEffect, useRef } from 'react';
import { Edit3, Check } from 'lucide-react';
import { useAssetBarStore } from '@/lib/assetBarStore';
import { ALL_ASSET_TYPES } from '@/lib/assetTypeRegistry';
import { QuickAccessChip } from '@/components/QuickAccessChip';
import { CategoryChip } from '@/components/CategoryChip';
import { useMarketStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { validateSymbol, createSafeParams } from '@/lib/services/validationService';

const CATEGORY_LABEL_MAP: Record<string, string> = {
  'Favoritos': 'category.favorites',
  'Criptomonedas': 'category.crypto',
  'Acciones': 'category.stocks',
  'Índices': 'category.indices',
  'Forex': 'category.forex',
  'Commodities': 'category.commodities',
  'Tecnología': 'category.technology',
  'Bancos': 'category.banks',
  'Consumo': 'category.consumer',
  'Salud': 'category.health',
  'Energía': 'category.energy',
  'Inmobiliario': 'category.realEstate',
  'Utilities': 'category.utilities',
  'Telecomunicaciones': 'category.telecom',
  'Industriales': 'category.industrials',
};

function getCategoryLabel(t: (k: string) => string, label: string): string {
  return CATEGORY_LABEL_MAP[label] ? t(CATEGORY_LABEL_MAP[label]) : label;
}

interface AssetToolbarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
}

function determinateAssetType(symbol: string): string {
  if (['CL', 'BZ', 'NG', 'ZW', 'ZC', 'ZS', 'SB', 'KC', 'CC', 'CT', 'LBS', 'ES'].includes(symbol)) return 'futures';
  if (symbol.endsWith('USD') && symbol.length <= 8) return 'crypto';
  if (symbol.match(/^[A-Z]{6}$/) || symbol.includes('USD')) { if (symbol.length === 6) return 'forex'; }
  const indicesSymbols = ['SPX', 'NDX', 'DXY', 'INDU', 'CCMP', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX', 'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 'MEXBOL', 'BOVESPA', 'KLCI', 'SET'];
  if (indicesSymbols.includes(symbol)) return 'index';
  if (['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'NICKEL', 'ALUMINUM', 'ZINC', 'FCX', 'NEM', 'SCCO', 'ALB', 'ARCH', 'WRK', 'IP', 'PKG'].includes(symbol)) return 'commodity';
  return 'stock';
}

export function AssetToolbar({ selectedType, onTypeChange }: AssetToolbarProps) {
  const { t } = useTranslation();
  const {
    pinnedAssets, categoryOrder, hiddenCategories,
    toolbarEditMode, setToolbarEditMode, unpinAsset, toggleCategoryVisibility,
  } = useAssetBarStore();
  const { setSelectedAsset } = useMarketStore();
  const loadedRef = useRef(false);

  // Load prices for pinned assets on mount
  useEffect(() => {
    if (pinnedAssets.length === 0 || loadedRef.current) return;
    loadedRef.current = true;

    const loadPinnedPrices = async () => {
      const store = useMarketStore.getState();
      const toFetch = pinnedAssets.filter(s => !store.assets.find(a => a.symbol === s));
      if (toFetch.length === 0) return;

      const batchSize = 5;
      for (let i = 0; i < toFetch.length; i += batchSize) {
        const batch = toFetch.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(async (symbol) => {
          if (!validateSymbol(symbol)) return;
          try {
            const params = createSafeParams({ symbol: symbol.toUpperCase(), type: 'price' });
            const res = await fetch(`/api/market?${params.toString()}`);
            if (!res.ok) return;
            const d = await res.json();
            if (d?.price !== undefined && d?.price !== null && !isNaN(Number(d.price))) {
              const { addOrUpdateAssetPrice } = useMarketStore.getState();
              addOrUpdateAssetPrice(
                symbol, symbol,
                parseFloat(String(d.price)),
                parseFloat(String(d.change ?? 0)),
                parseFloat(String(d.changePercent ?? 0)),
                determinateAssetType(symbol) as any
              );
            }
          } catch { /* ok */ }
        }));
      }
    };

    loadPinnedPrices();
  }, [pinnedAssets]);

  const orderedTypes = categoryOrder
    .map((v) => ALL_ASSET_TYPES.find((t) => t.value === v))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);
  const visibleTypes = orderedTypes.filter((t) => !hiddenCategories.includes(t.value));

  const handleSelectPinned = (symbol: string) => {
    const store = useMarketStore.getState();
    const asset = store.assets.find((a) => a.symbol === symbol)
      || { id: `pinned_${symbol}`, symbol, name: symbol, type: determinateAssetType(symbol) as any, price: 0, change: 0, changePercent: 0, isFavorite: false };
    setSelectedAsset(asset);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {pinnedAssets.length > 0 && (
        <div className="flex items-center gap-1 pr-2 border-r border-border/50">
          {pinnedAssets.map((sym) => (
            <QuickAccessChip
              key={sym}
              symbol={sym}
              onUnpin={unpinAsset}
              onSelect={handleSelectPinned}
            />
          ))}
        </div>
      )}

      {visibleTypes.map((type) => (
        <CategoryChip key={type.value} typeConfig={type} isEditMode={toolbarEditMode} />
      ))}

      {hiddenCategories.length > 0 && toolbarEditMode && (
        <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/50">
          <span className="text-[10px] text-muted-foreground">{t('toolbar.hidden')}</span>
          {hiddenCategories.map((v) => {
            const cfg = ALL_ASSET_TYPES.find((c) => c.value === v);
            if (!cfg) return null;
            return (
              <button
                key={v}
                onClick={() => toggleCategoryVisibility(v)}
                className="px-2 py-0.5 rounded bg-muted/30 text-[10px] text-muted-foreground hover:bg-muted/60 transition-colors"
                title={t('toolbar.showCategory')}
              >
                {cfg.icon} {getCategoryLabel(t, cfg.label)}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setToolbarEditMode(!toolbarEditMode)}
        className={`p-1.5 rounded-lg transition-colors ${
          toolbarEditMode ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted text-muted-foreground'
        }`}
        title={toolbarEditMode ? t('toolbar.finishEditing') : t('toolbar.customizeBar')}
        aria-label={toolbarEditMode ? t('toolbar.finishEditing') : t('toolbar.customizeBar')}
      >
        {toolbarEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
