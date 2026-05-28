'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, ChevronLeft, ChevronRight, AlertCircle, Pin, EyeOff, GripVertical } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { getAssetsByCategory, getAssetDescription } from '@/lib/scannerAssets';
import { priceCache } from '@/lib/services/priceCache';
import { validateSymbol, createSafeParams } from '@/lib/services/validationService';
import { errorLoggingService } from '@/lib/services/errorLoggingService';
import { useAssetBarStore } from '@/lib/assetBarStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { AssetType } from '@/lib/types';
import type { AssetTypeConfig } from '@/lib/assetTypeRegistry';

interface CategoryChipProps {
  typeConfig: AssetTypeConfig;
  isEditMode: boolean;
}

function determinateAssetType(symbol: string): AssetType {
  if (['CL', 'BZ', 'NG', 'ZW', 'ZC', 'ZS', 'SB', 'KC', 'CC', 'CT', 'LBS', 'ES'].includes(symbol)) {
    return 'futures';
  }
  if (symbol.endsWith('USD') && symbol.length <= 8) {
    return 'crypto';
  }
  if (symbol.match(/^[A-Z]{6}$/) || symbol.includes('USD')) {
    if (symbol.length === 6) return 'forex';
  }
  const indicesSymbols = ['SPX', 'NDX', 'DXY', 'INDU', 'CCMP', 'VIX', 'DAX', 'FTSE', 'CAC40', 'IBEX', 'MIB', 'ASX', 'NIKKEI', 'HANGSENG', 'SHANGHAI', 'SENSEX', 'KOPSI', 'SSETF', 'MEXBOL', 'BOVESPA', 'KLCI', 'SET'];
  if (indicesSymbols.includes(symbol)) return 'index';
  if (['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'NICKEL', 'ALUMINUM', 'ZINC', 'FCX', 'NEM', 'SCCO', 'ALB', 'ARCH', 'WRK', 'IP', 'PKG'].includes(symbol)) return 'commodity';
  return 'stock';
}

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

export function CategoryChip({ typeConfig, isEditMode }: CategoryChipProps) {
  const router = useRouter();
  const { assets, toggleFavorite, setSelectedAsset, updateAssetPrice, addOrUpdateAssetPrice } = useMarketStore();
  const { t } = useTranslation();
  const { pinAsset, unpinAsset, reorderCategoryUp, reorderCategoryDown, toggleCategoryVisibility } = useAssetBarStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pagination, setPagination] = useState(0);
  const loadedRef = useRef(false);
  const mountedRef = useRef(false);
  const failedRef = useRef<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getScannerAssets = useCallback((categoryName: string) => {
    const symbols = getAssetsByCategory(categoryName);
    const uniqueSymbols = Array.from(new Set(symbols));
    return uniqueSymbols.map((symbol: string, index: number) => {
      const existing = assets.find(a => a.symbol === symbol);
      const info = getAssetDescription(symbol);
      return {
        id: existing?.id || `scanner_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${index}_${symbol}`,
        symbol,
        name: info?.name || existing?.name || symbol,
        type: existing?.type || determinateAssetType(symbol),
        price: existing?.price ?? 0,
        change: existing?.change ?? 0,
        changePercent: existing?.changePercent ?? 0,
        isFavorite: existing?.isFavorite ?? false,
      };
    });
  }, [assets]);

  const filteredList = (): any[] => {
    const list = typeConfig.value === 'favorites'
      ? (() => {
          const favorites = useMarketStore.getState().favorites;
          if (favorites.length === 0) return [];
          return favorites.map(sym => {
            const existing = assets.find(a => a.symbol === sym);
            return existing || { id: `fav_${sym}`, symbol: sym, name: sym, type: determinateAssetType(sym) as AssetType, price: 0, change: 0, changePercent: 0, isFavorite: true };
          });
        })()
      : typeConfig.isScanner
        ? getScannerAssets(typeConfig.label)
        : assets.filter(a => a.type === typeConfig.value);
    return list;
  };

  // Preload ALL favorites on mount (creates Asset entries if missing)
  useEffect(() => {
    const preloadFavorites = async () => {
      setInitialLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => setInitialLoading(false), 15000);
      try {
        const store = useMarketStore.getState();
        const symbols = store.favorites.filter(s => !store.assets.find(a => a.symbol === s));
        const batchSize = 5;
        for (let i = 0; i < symbols.length; i += batchSize) {
          const batch = symbols.slice(i, i + batchSize);
          await Promise.allSettled(batch.map(async (symbol) => {
            if (!validateSymbol(symbol)) return;
            try {
              const params = createSafeParams({ symbol: symbol.toUpperCase(), type: 'price' });
              const res = await fetch(`/api/market?${params.toString()}`, { signal: controller.signal });
              if (!res.ok) return;
              const d = await res.json();
              if (d?.price !== undefined && d?.price !== null && !isNaN(Number(d.price))) {
                const { addOrUpdateAssetPrice } = useMarketStore.getState();
                addOrUpdateAssetPrice(
                  symbol, symbol,
                  parseFloat(String(d.price)),
                  parseFloat(String(d.change ?? 0)),
                  parseFloat(String(d.changePercent ?? 0)),
                  determinateAssetType(symbol)
                );
              }
            } catch { /* individual fetch failure ok */ }
          }));
        }
      } finally {
        clearTimeout(timeoutId);
        setInitialLoading(false);
      }
    };
    preloadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch prices when dropdown opens (uses store.getState() for fresh data)
  useEffect(() => {
    if (!open) {
      loadedRef.current = false;
      failedRef.current = new Set();
      return;
    }

    const abortController = new AbortController();

    const fetchPrices = async () => {
      setLoading(true);
      loadedRef.current = true;
      const timeoutId = setTimeout(() => setLoading(false), 5000);
      const currentFailed = new Set<string>();
      failedRef.current = currentFailed;
      const store = useMarketStore.getState();

      try {
        if (typeConfig.value === 'favorites') {
          const favSymbols = store.favorites;
          await Promise.allSettled(favSymbols.map(async (symbol) => {
            if (!validateSymbol(symbol)) { currentFailed.add(symbol); return; }
            const params = createSafeParams({ symbol: symbol.toUpperCase(), type: 'price' });
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 2000);
            try {
              const res = await fetch(`/api/market?${params.toString()}`, { signal: controller.signal });
              clearTimeout(tid);
              if (!res.ok) { currentFailed.add(symbol); return; }
              const d = await res.json();
              if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
                const price = parseFloat(String(d.price));
                if (!isNaN(price)) {
                  const { addOrUpdateAssetPrice } = useMarketStore.getState();
                  addOrUpdateAssetPrice(symbol, symbol, price, parseFloat(String(d.change ?? 0)), parseFloat(String(d.changePercent ?? 0)), determinateAssetType(symbol));
                } else { currentFailed.add(symbol); }
              } else { currentFailed.add(symbol); }
            } catch { clearTimeout(tid); currentFailed.add(symbol); }
          }));
        } else if (typeConfig.isScanner) {
          const symbols = getAssetsByCategory(typeConfig.label);
          const toFetch: string[] = [];
          for (const sym of symbols) {
            if (!validateSymbol(sym)) { currentFailed.add(sym); continue; }
            const cached = priceCache.get(sym);
            if (cached) {
              store.addOrUpdateAssetPrice(sym, sym, cached.price, cached.change, cached.changePercent, 'crypto');
            } else { toFetch.push(sym); }
          }
          for (let i = 0; i < toFetch.length; i += 3) {
            const batch = toFetch.slice(i, i + 3);
            await Promise.allSettled(batch.map(async (symbol) => {
              const params = createSafeParams({ symbol: symbol.toUpperCase(), type: 'price' });
              const controller = new AbortController();
              const tid = setTimeout(() => controller.abort(), 2000);
              try {
                const res = await fetch(`/api/market?${params.toString()}`, { signal: controller.signal });
                clearTimeout(tid);
                if (!res.ok) { currentFailed.add(symbol); return; }
                const d = await res.json();
                if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
                  const price = parseFloat(String(d.price));
                  if (!isNaN(price)) {
                    const change = parseFloat(String(d.change ?? 0));
                    const changePercent = parseFloat(String(d.changePercent ?? 0));
                    priceCache.set(symbol, price, change, changePercent);
                    const { addOrUpdateAssetPrice } = useMarketStore.getState();
                    addOrUpdateAssetPrice(symbol, symbol, price, change, changePercent, determinateAssetType(symbol));
                  } else { currentFailed.add(symbol); }
                } else { currentFailed.add(symbol); }
              } catch { clearTimeout(tid); currentFailed.add(symbol); }
            }));
            if (i + 3 < toFetch.length) await new Promise(r => setTimeout(r, 500));
          }
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
        loadedRef.current = true;
      }
    };

    fetchPrices();

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, typeConfig]);
  const list = filteredList();
  if (list.length === 0 && !isEditMode) return null;

  const ITEMS_PER_PAGE = 20;
  const currentPage = pagination;
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedList = list.slice(startIdx, endIdx);
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);

  const handleSelect = (assetId: string) => {
    let asset = assets.find(a => a.id === assetId);
    if (!asset) {
      const parts = assetId.split('_');
      const symbol = parts[parts.length - 1];
      if (symbol) {
        const existing = assets.find(a => a.symbol === symbol);
        asset = { id: assetId, symbol, name: symbol, type: 'crypto', price: existing?.price ?? 0, change: existing?.change ?? 0, changePercent: existing?.changePercent ?? 0, isFavorite: existing?.isFavorite ?? false };
      }
    }
    if (asset) {
      setSelectedAsset(asset);
      setOpen(false);
      if (window.location.pathname !== '/') router.push('/');
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
          open ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted text-foreground'
        }`}
      >
        {isEditMode && (
          <GripVertical className="w-3 h-3 text-muted-foreground cursor-grab" />
        )}
        <span>{typeConfig.icon}</span>
        <span>{getCategoryLabel(t, typeConfig.label)}</span>
        <span className="text-xs opacity-70">({list.length})</span>
        {loading
          ? <Loader2 className="w-3 h-3 animate-spin ml-0.5" />
          : <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {isEditMode && (
        <div className="flex gap-0.5 mt-0.5">
          <button onClick={() => reorderCategoryUp(typeConfig.value)} className="p-0.5 rounded hover:bg-muted text-muted-foreground text-[10px]" title={t('category.moveUp')}>▲</button>
          <button onClick={() => reorderCategoryDown(typeConfig.value)} className="p-0.5 rounded hover:bg-muted text-muted-foreground text-[10px]" title={t('category.moveDown')}>▼</button>
          <button onClick={() => toggleCategoryVisibility(typeConfig.value)} className="p-0.5 rounded hover:bg-muted text-muted-foreground text-[10px]" title={t('category.hideCategory')}>
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      )}

          {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
          {(loading && !loadedRef.current) || (initialLoading && typeConfig.value === 'favorites' && list.some(a => a.price === 0)) ? (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('category.loadingPrices')}
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto py-1">
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-3">{t('category.noResults')}</p>
                ) : (
                  paginatedList.map((asset: any) => {
                    const isFailed = failedRef.current.has(asset.symbol);
                    return (
                      <div key={asset.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors group" onClick={() => !isFailed && handleSelect(asset.id)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <div className="text-right">
                            {isFailed ? (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4 text-destructive" />
                                <p className="text-xs text-destructive font-medium">{t('category.noData')}</p>
                              </div>
                            ) : asset.price > 0 ? (
                              <>
                                <p className="text-xs font-mono font-bold text-foreground">${asset.price.toFixed(2)}</p>
                                <p className={`text-xs font-bold ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                                  {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">--</p>
                            )}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); pinAsset(asset.symbol); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all" title={t('category.pin')}
                          >
                            <Pin className="w-3 h-3 text-muted-foreground" />
                          </button>
                          {typeConfig.value === 'favorites' && (
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.symbol); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                              <span className="w-3 h-3 text-red-500">♥</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {list.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
                  <button onClick={() => setPagination(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-muted-foreground">{currentPage + 1} / {totalPages}</span>
                  <button onClick={() => setPagination(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
